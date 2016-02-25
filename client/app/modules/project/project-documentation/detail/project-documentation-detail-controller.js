angular.module('buiiltApp').controller('projectDocumentationDetailCtrl', function($rootScope, $scope, document, uploadService, $mdDialog, $mdToast, $stateParams, fileService, socket, notificationService, peopleService) {
    $scope.document = document;
    getAcvititiesAndHistoriesByUser($scope.document);
    notificationService.markItemsAsRead({id: $stateParams.documentId}).$promise.then(function() {
        $rootScope.$broadcast("UpdateCountNumber", {type: "document", number: document.__v});
    });

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
        $mdDialog.show({
            targetEvent: $event,
            controller: function($scope) {
                $scope.history = history;
                $scope.closeModal = function() {
                    $mdDialog.cancel();
                };

                $scope.downloadFile = function() {
                    filepicker.exportFile(
                        {url: $scope.history.link, filename: $scope.history.name},
                        function(Blob){
                            console.log(Blob.url);
                        }
                    );
                };
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/file-history-detail.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    function setUploadReversion() {
        $scope.uploadReversion = {
            files: [],
            versionTags: [],
            teamMembers: [],
        };
        $scope.allowUploadReversion = ($scope.document.owner._id == $rootScope.currentUser._id) ? true : false;
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
    }
});