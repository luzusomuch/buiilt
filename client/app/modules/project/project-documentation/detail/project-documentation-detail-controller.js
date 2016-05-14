angular.module('buiiltApp').controller('projectDocumentationDetailCtrl', function($rootScope, $scope, $timeout, document, uploadService, $mdDialog, $mdToast, $stateParams, fileService, socket, notificationService, peopleService, dialogService) {
    $scope.document = document;
    $scope.document.currentPath = $scope.document.fileHistory[$scope.document.fileHistory.length-1].link;
    $scope.document.currentVersion = $scope.document.fileHistory.length;
    $scope.currentUser = $rootScope.currentUser;

    /*Check if current team is team owner*/
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

    getAcvititiesAndHistoriesByUser($scope.document);
    
    /*Update last access for current document*/
    fileService.lastAccess({id: $stateParams.documentId}).$promise.then(function(data) {
        if ($scope.document.__v > 0) {
            $rootScope.$broadcast("UpdateCountNumber", {type: "document", number: 1});
        }
    });
    
    /*Mark all notifications related to document as read*/
    $timeout(function() {
        notificationService.markItemsAsRead({id: $stateParams.documentId}).$promise.then(function() {
            _.each($scope.document.activities, function(a){
                a.unread = false;
                a.unreadLine=false;
            });
        });
    }, 3000);

    /*Filter unread activities belong to notifications list*/
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

    filterUnreadActivites($scope.document);

    /*Get reversion tags*/
    $scope.versionTags = [];
    _.each($rootScope.currentTeam.versionTags, function(tag) {
        $scope.versionTags.push({tag:tag});
    });

    /*Select reversion tags for upload reversion
    Select project members to assign to document reversion*/
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

    /*Check if current user is send acknowledgement to reversion owner or not*/
    function checkAcknowLedgement(document) {
        _.each(document.activities, function(activity) {
            if (activity.type === "upload-reversion" || activity.type === "upload-file") {
                if (_.findIndex(activity.acknowledgeUsers, function(item) {
                    if (item._id) {
                        return item._id._id == $scope.currentUser._id && item.isAcknow;
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

    /*Receive when someone updated document*/
    socket.on("document:update", function(data) {
        $scope.document = data;
        getAcvititiesAndHistoriesByUser($scope.document);
        checkAcknowLedgement($scope.document);
        notificationService.markItemsAsRead({id: $stateParams.documentId}).$promise.then();
    });

    /*Checking activities and file histories that belong to current user*/
    function getAcvititiesAndHistoriesByUser(document) {
        if (document.owner._id.toString()!==$scope.currentUser._id.toString()) {
            var activities = [];
            var fileHistory = [];
            _.each(document.fileHistory, function(history) {
                if (_.findIndex(history.members, function(member) {
                    if (member._id)
                        return member._id.toString()===$scope.currentUser._id.toString();
                }) !== -1) {
                    fileHistory.push(history);
                }
            });
            _.each(document.activities, function(activity) {
                if (activity.type==="upload-reversion") {
                    if (_.findIndex(activity.members, function(member) {
                        if (member._id)
                            return member._id.toString()===$scope.currentUser._id.toString();
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

    /*Get project members list*/
    function getProjectMembers(id) {
        peopleService.getInvitePeople({id: id}).$promise.then(function(res) {
            $scope.projectMembers = [];
            _.each($rootScope.roles, function(role) {
                _.each(res[role], function(tender){
                    if (tender.hasSelect) {
                        var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                            if (tenderer._id) {
                                return tenderer._id._id.toString() === $scope.currentUser._id.toString();
                            }
                        }) !== -1) ? true : false;
                        if (!isLeader) {
                            _.each(tender.tenderers, function(tenderer) {
                                var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                    return member._id.toString() === $scope.currentUser._id.toString();
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
                                if (tenderer._id._id.toString() === $scope.currentUser._id.toString()) {
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
            _.remove($scope.projectMembers, {_id: $scope.currentUser._id});
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

    /*Send acknowledgement to reversion owner*/
    $scope.acknowledgement = function(activity) {
        fileService.acknowledgement({id: $stateParams.documentId, activityId: activity._id}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
            $rootScope.$broadcast("Document.Updated", res);
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    /*Open file history list*/
    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    $scope.uploadReversion = {};

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    $scope.uploadReversion = {};

    function onSuccess(file){
        $scope.uploadReversion.file = file;
        $scope.uploadReversionDocument();
    };

    /*Upload document reversion with vaid version tags and project members
    then call mixpanel track current user has uploaded document reversion*/
    $scope.uploadReversionDocument = function() {
        // var versionTags = _.map(_.filter($scope.versionTags, {select: true}), 'tag');
        // if (versionTags.length===0) {
            // dialogService.showToast("Please Select At Least 1 Version Tag");
        // } else if (!$scope.uploadReversion.file) {
            // dialogService.showToast("Please Select A Document");
        // } else {
            // $scope.uploadReversion.file.versionTags = versionTags.join();
            uploadService.uploadReversion({id: $stateParams.documentId}, $scope.uploadReversion).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Document Reversion Successfully Uploaded");
                $rootScope.$broadcast("Document.Updated", res);
            }, function(err) {
                dialogService.showToast("Error");
            });
        // }
    };

    /*Show modal with a valid name*/
    $scope.showModal = function($event, modalName) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectDocumentationDetailCtrl',
            resolve: {
                document: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-documentation/detail/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*Show a toast dialog*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    /*Show invite more members to reversion*/
    $scope.showInviteMoreMemberModal = function($event, activity) {
        $rootScope.activity = activity;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectDocumentationDetailCtrl',
            resolve: {
                document: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-documentation/detail/invite-members.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Invite more members to document reversion*/
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

    /*Archive or unarchived document*/
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

    var historyName;
    $scope.changeVersion = function(type, history, nextOrPrevious, $index) {
        if (type==="dropdown") {
            $scope.document.currentPath = history.link;
            $scope.document.currentVersion = $index;
            historyName = history.version;
        } else if (type==="button") {
            var index = _.findIndex($scope.document.fileHistory, function(history) {
                return history.link==$scope.document.currentPath;
            });
            if (nextOrPrevious==="next") {
                index+=1;
                if (index === $scope.document.fileHistory.length) {
                    index = 0;                    
                }
            } else {
                index-=1;
                if (index < 0) {
                    index = $scope.document.fileHistory.length-1;
                }
            }
            $scope.document.currentPath = $scope.document.fileHistory[index].link;
            $scope.document.currentVersion = index+1;
        }
    };

    $scope.openDocumentInNewTab = function() {
        window.open($scope.document.currentPath, "_blank").focus();
    };

    $scope.downloadDocument = function() {
        filepicker.exportFile({
            url: $scope.document.currentPath, filename: (historyName) ? historyName : $scope.document.name
        });
    };

    $scope.changeName = function() {
        if (document.owner._id!==$scope.currentUser._id) {
            dialogService.showToast("Not Allow");
            return;
        }
        if ($scope.document.name.trim().length===0) {
            dialogService.showToast("Please Enter Document Name");
        } else {
            $scope.document.editType="edit";
            fileService.update({id: document._id}, $scope.document).$promise.then(function(res) {
                dialogService.showToast("Change Document Name Successfully");
                $scope.showEdit = false;
            }, function(err){
                dialogService.showToast("Error");
            });
        }
    };
});