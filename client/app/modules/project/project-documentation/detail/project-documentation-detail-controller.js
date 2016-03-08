angular.module('buiiltApp').controller('projectDocumentationDetailCtrl', function($rootScope, $scope, $timeout, document, uploadService, $mdDialog, $mdToast, $stateParams, fileService, socket, notificationService, peopleService) {
    $scope.document = document;

    // Check owner team
    $scope.isOwnerTeam=false;
    if (_.findIndex($rootScope.currentTeam.leader, function(leader) {
        return leader._id.toString()===document.owner._id.toString();
    }) !== -1 || _.findIndex($rootScope.currentTeam.member, function(member) {
        if (member._id && member.status=="Active") {
            return member._id._id.toString()===document.owner._id.toString();
        }
    }) !== -1) {
        $scope.isOwnerTeam=true;
    }
    // end check owner team

    getAcvititiesAndHistoriesByUser($scope.document);

    // remove notifications count immeditely
    $timeout(function() {
        $rootScope.$broadcast("UpdateCountNumber", {type: "document", number: 1});
    },500);
    fileService.lastAccess({id: $stateParams.documentId}).$promise.then(function(data) {
        $rootScope.$emit("Document.Read", document);
    });
    // end
    
    // set timeout 3s for mark as read
    $timeout(function() {
        notificationService.markItemsAsRead({id: $stateParams.documentId}).$promise.then(function() {
            markActivitesAsRead($scope.document);
        });
    }, 3000);
    // end timeout

    // function to filter out that unread activities
    function filterUnreadActivites(document) {
        if (document.__v > 0) {
            var temp = 0;
            for (var i = document.activities.length - 1; i >= 0; i--) {
                if (i===0) {
                    document.activities[i].unreadLine=true;
                }
                document.activities[i].unread = true;
                temp+=1;
                if (temp===document.__v) {
                    break;
                }
            };
        }
    };
    // end filter unread activities

    // function to mark activities as read
    function markActivitesAsRead(document) {
        _.each(document.activities, function(a){
            a.unread = false;
            a.unreadLine=false;
        });
    };
    // end mark activities as read

    filterUnreadActivites($scope.document);

    $scope.versionTags = [];
    _.each($rootScope.currentTeam.versionTags, function(tag) {
        $scope.versionTags.push({tag:tag});
    });

    $scope.selectTag = function(index, type) {
        if (type==="version") {
            _.each($scope.versionTags, function(tag) {
                tag.select = false;
            });
            $scope.versionTags[index].select = !$scope.versionTags[index].select;
        } else if (type==="member") {
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        }
    };

    function checkAcknowLedgement(document) {
        _.each(document.activities, function(activity) {
            if (activity.type === "upload-reversion" || activity.type === "upload-file") {
                if (_.findIndex(activity.acknowledgeUsers, function(item) {
                    if (item._id) {
                        return item._id._id == $rootScope.currentUser._id && item.isAcknow;
                    }
                }) !== -1) {
                    activity.isAcknow = true;
                } else {
                    activity.isAcknow = false;
                }
            }
        });
    };
    checkAcknowLedgement($scope.document);

    socket.emit("join", document._id);
    socket.on("document:update", function(data) {
        $scope.document = data;
        getAcvititiesAndHistoriesByUser($scope.document);
        checkAcknowLedgement($scope.document);
        notificationService.markItemsAsRead({id: $stateParams.documentId}).$promise.then();
    });

    function getAcvititiesAndHistoriesByUser(document) {
        if (document.owner._id.toString()!==$rootScope.currentUser._id.toString()) {
            var activities = [];
            var fileHistory = [];
            _.each(document.fileHistory, function(history) {
                if (_.findIndex(history.members, function(member) {
                    if (member._id)
                        return member._id.toString()===$rootScope.currentUser._id.toString();
                }) !== -1) {
                    fileHistory.push(history);
                }
            });
            _.each(document.activities, function(activity) {
                if (activity.type==="upload-reversion") {
                    if (_.findIndex(activity.members, function(member) {
                        if (member._id)
                            return member._id.toString()===$rootScope.currentUser._id.toString();
                    }) !== -1) {
                        activities.push(activity);
                    }
                } else {
                    activities.push(activity);
                }
            });
            document.fileHistory = fileHistory;
            document.activities = activities;
        }
    };

    function getProjectMembers(id) {
        peopleService.getInvitePeople({id: id}).$promise.then(function(res) {
            $scope.projectMembers = [];
            _.each($rootScope.roles, function(role) {
                _.each(res[role], function(tender){
                    if (tender.hasSelect) {
                        var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                            if (tenderer._id) {
                                return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                            }
                        }) !== -1) ? true : false;
                        if (!isLeader) {
                            _.each(tender.tenderers, function(tenderer) {
                                var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                    return member._id.toString() === $rootScope.currentUser._id.toString();
                                });
                                if (memberIndex !== -1) {
                                    _.each(tenderer.teamMember, function(member) {
                                        member.select = false;
                                        $scope.projectMembers.push(member);
                                    });
                                }
                            });
                            if (tender.tenderers[0]._id) {
                                tender.tenderers[0]._id.select = false;
                                $scope.projectMembers.push(tender.tenderers[0]._id);
                            } else {
                                $scope.projectMembers.push({email: tender.tenderers[0].email, select: false});
                            }
                        } else {
                            $scope.projectMembers.push(tender.tenderers[0]._id);
                            _.each(tender.tenderers, function(tenderer) {
                                if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                    _.each(tenderer.teamMember, function(member) {
                                        member.select = false;
                                        $scope.projectMembers.push(member);
                                    });
                                }
                            });
                        }
                    }
                });
            });
            _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
            if ($rootScope.activity) {
                _.each($rootScope.activity.members, function(member) {
                    if (member._id) 
                        _.remove($scope.projectMembers, {_id: member._id});
                    else
                        _.remove($scope.projectMembers, {email: member.email});
                });
            }
        });
    };

    getProjectMembers(document.project);

    $scope.acknowledgement = function(activity) {
        fileService.acknowledgement({id: $stateParams.documentId, activityId: activity._id}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
            $rootScope.$broadcast("Document.Updated", res);
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    $scope.openHistoryDetail = function($event, history) {
        // $mdDialog.show({
        //     targetEvent: $event,
        //     controller: function($scope) {
        //         $scope.history = history;
        //         $scope.closeModal = function() {
        //             $mdDialog.cancel();
        //         };

        //         $scope.downloadFile = function() {
        //             filepicker.exportFile(
        //                 {url: $scope.history.link, filename: $scope.history.name},
        //                 function(Blob){
        //                     console.log(Blob.url);
        //                 }
        //             );
        //         };
        //     },
        //     templateUrl: 'app/modules/project/project-files/detail/partials/file-history-detail.html',
        //     parent: angular.element(document.body),
        //     clickOutsideToClose: false
        // });
        var win = window.open(history.link, "_blank");
        win.focus();
    };

    function setUploadReversion() {
        $scope.uploadReversion = {
            files: [],
            versionTags: [],
            teamMembers: [],
        };
    };

    setUploadReversion();

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadReversion.files.push(file);
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    $scope.uploadReversionDocument = function() {
        $scope.uploadReversion.versionTags = _.filter($scope.versionTags, {select: true});
        $scope.uploadReversion.teamMembers = _.filter($scope.projectMembers, {select: true});
        if ($scope.uploadReversion.files.length === 0) {
            $scope.showToast("Please Select a File to Upload...");
            return;
        } else if ($scope.uploadReversion.versionTags.length===0) {
            $scope.showToast("Please Select At Least 1 Version Tag");
            return false;
        } else if ($scope.uploadReversion.teamMembers.length===0) {
            $scope.showToast("Please Select At Least 1 Version Team member");
            return false;
        } else {
            uploadService.uploadReversion({id: $scope.document._id}, $scope.uploadReversion).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Document Revision Successfully Uploaded.");
				
				//Document Revision Uploaded
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Document Revision Uploaded");
				
                $rootScope.$broadcast("Document.Updated", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    $scope.showModal = function($event, modalName) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectDocumentationDetailCtrl',
            resolve: {
                document: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-documentation/detail/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.download = function(name, link) {
        filepicker.exportFile(
            {url: link, filename: name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    };

    $scope.showInviteMoreMemberModal = function($event, activity) {
        $rootScope.activity = activity;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectDocumentationDetailCtrl',
            resolve: {
                document: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-documentation/detail/invite-members.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.inviteMoreMembers = function() {
        $scope.newMembers = _.filter($scope.projectMembers, {select: true});
        if ($scope.newMembers.length === 0) {
            $scope.showToast("Please Select At Least 1 Member");
            return;
        } else {
            fileService.assignMoreMembers({id: $scope.document._id, activityAndHisToryId: $rootScope.activity.activityAndHisToryId}, $scope.newMembers).$promise.then(function(res) {
                $scope.showToast("Successfully");
                $scope.closeModal();
                $rootScope.activity = null;
            }, function(err) {$scope.showToast("Error");});
        }
    };

    $scope.archive = function() {
        var confirm = $mdDialog.confirm().title((!$scope.document.isArchive) ? "Archive?" : "Unarchive?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.document.editType = (!$scope.document.isArchive) ? "archive" : "unarchive";
            $scope.document.isArchive = !$scope.document.isArchive;
            fileService.update({id: $scope.document._id}, $scope.document).$promise.then(function(res) {
                $scope.showToast("This Document Has Been Archived Successfully.");
            }, function(err) {
                $scope.showToast("Error");
            });
        }, function() {
            
        });
    };
});