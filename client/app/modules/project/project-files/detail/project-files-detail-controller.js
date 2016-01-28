angular.module('buiiltApp').controller('projectFileDetailCtrl', function($scope, $rootScope, file, $mdDialog, uploadService, fileService, $mdToast, peopleService, $stateParams, messageService, taskService, $state, people) {
	$scope.file = file;
    $scope.orginalActivities = angular.copy($scope.file.activities);
    $scope.isShowRelatedItem = true;
    $scope.people = people;

    $scope.chipsFilter = function() {
        $scope.isShowRelatedItem = !$scope.isShowRelatedItem;
    };

    $scope.$watch("isShowRelatedItem", function(value) {
        if (!value) {
            var activities = [];
            var relatedActivities = ["related-task","related-thread","related-file"];
            _.each($scope.orginalActivities, function(activity) {
                if (_.indexOf(relatedActivities, activity.type) === -1) {
                    activities.push(activity);
                }
            });
            $scope.file.activities = activities;
        } else {
            $scope.file.activities = $scope.orginalActivities;
        }
    });

    function getProjectMembers(id) {
        $scope.membersList = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
        if ($rootScope.currentUser.isLeader) {
            _.each($rootScope.roles, function(role) {
                _.each(people[role], function(tender) {
                    if (tender.hasSelect) {
                        var winnerTenderer = tender.tenderers[0];
                        if (winnerTenderer._id) {
                            winnerTenderer._id.select = false;
                            $scope.membersList.push(winnerTenderer._id);
                        } else if (winnerTenderer.email) {
                            $scope.membersList.push({email: winnerTenderer.email, type: role, select: false});
                        }
                    }
                    // get employees list
                    var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id == $rootScope.currentUser._id;
                        }
                    });
                    if (currentTendererIndex !== -1) {
                        var currentTenderer = tender.tenderers[currentTendererIndex];
                        _.each(currentTenderer.teamMember, function(member) {
                            member.select = false;
                            $scope.membersList.push(member);
                        });
                    }
                });
            });
        } else {
            $scope.membersList = $rootScope.currentTeam.leader;
            _.each($rootScope.currentTeam.member, function(member) {
                $scope.membersList.push(member);
            });
        }
        // get unique member 
        $scope.membersList = _.uniq($scope.membersList, "_id");

        // filter members list again
        _.each(file.members, function(member) {
            _.remove($scope.membersList, {_id: member._id});
        });

        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});

        // get invitees for related item
        $scope.invitees = $scope.file.members;
        _.each($scope.file.notMembers, function(member) {
            $scope.invitees.push({email: member});
        });
        $scope.invitees.push($scope.file.owner);
        $scope.invitees = _.uniq($scope.invitees, "email");
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.showModal = function($event, modalName) {
        if (modalName === "add-related-thread.html") {
            $scope.relatedThread = {};
        } else if (modalName === "add-related-task.html") {
            $scope.minDate = new Date();
            $scope.relatedTask = {};
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectFileDetailCtrl',
            resolve: {
                file: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.fileId}).$promise;
                },
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/' + modalName,
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

    $scope.editFile = function(form) {
        if (form.$valid) {
            $scope.file.editType = "edit";
            $scope.update($scope.file);
        } else {
            $scope.showToast("Error");
        }
    };

    $scope.selectMember = function(index, type) {
        if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        } else {
            $scope.invitees[index].select = !$scope.invitees[index].select;
        }
    };

    $scope.assignMember = function() {
        $scope.file.newMembers = _.filter($scope.membersList, {select: true});
        $scope.file.editType = "assign";
        $scope.update($scope.file);
    };

    $scope.update = function(file) {
        if (file.tags.length === 0) {
            $scope.showToast("Please enter at least 1 tag");
            return;
        } else if (file.members.length === 0) {
            $scope.showToast("Please select at least 1 invitee");
            return;
        }
        fileService.update({id: file._id}, file).$promise.then(function(res) {
            $scope.file = file;
            $scope.closeModal();
            switch (file.editType) {
                case "edit":
                    $scope.showToast("Update file information successfully");
                break;

                case "assign":
                    $scope.showToast("Assign more invitees successfully");
                break;

                default:
                break
            }
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.createRelatedThread = function(form) {
        if (form.$valid) {
            $scope.relatedThread.members = _.filter($scope.invitees, {select: true});
            if ($scope.relatedThread.members.length > 0) {
                $scope.relatedThread.belongTo = $scope.file._id;
                $scope.relatedThread.belongToType = "file";
                $scope.relatedThread.type = "project-message";
                messageService.create({id: $stateParams.id}, $scope.relatedThread).$promise.then(function(relatedThread) {
                    $scope.closeModal();
                    $scope.showToast("Create Related Thread Successfully!");
                    $state.go("project.messages.detail", {id: $stateParams.id, messageId: relatedThread._id});
                }, function(err) {$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                return;
            }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    $scope.createRelatedTask = function(form) {
        if (form.$valid) {
            $scope.relatedTask.members = _.filter($scope.invitees, {select: true});
            if ($scope.relatedTask.members.length > 0) {
                $scope.relatedTask.belongTo = $scope.file._id;
                $scope.relatedTask.belongToType = "file";
                $scope.relatedTask.type = "project-message";
                taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(relatedTask) {
                    $scope.closeModal();
                    $scope.showToast("Create Related Task Successfully!");
                    $state.go("project.tasks.detail", {id: $stateParams.id, taskId: relatedTask._id});
                }, function(err) {$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                return;
            }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    // create related file
    $scope.relatedFile = {
        files:[],
        tags:[],
        belongTo: $scope.file._id,
        belongToType: "file"
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            // add max files for multiple pick
            // {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(file, type){
        file.type = "file";
        if (type === "related") 
            $scope.relatedFile.files.push(file);
        else
            $scope.fileReversion.files.push(file);
    };

    $scope.createRelatedFile = function() {
        $scope.relatedFile.tags = _.filter($scope.tags, {select: true});
        $scope.relatedFile.members = _.filter($scope.invitees, {select: true});
        if ($scope.relatedFile.files.length == 0) {
            $scope.showToast("Please choose at least 1 file");
        } else if ($scope.relatedFile.tags.length == 0) {
            $scope.showToast("Please enter at least 1 tags");
        } else if ($scope.relatedFile.members.length == 0) {
            $scope.showToast("Please choose at least 1 member");
        } else { 
            uploadService.upload({id: $stateParams.id}, $scope.relatedFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Upload new related file successfully");
                $state.go("project.files.detail", {id: res[0].project, fileId: res[0]._id});
            }, function(err) {$scope.showToast("Error");});
        }
    };

    // upload reversion
    $scope.fileReversion = {
        files: []
    };

    $scope.uploadReversionFile = function() {
        if ($scope.fileReversion.files.length === 0) {
            $scope.showToast("Please check your input again");
            return;
        } else {
            uploadService.uploadReversion({id: $scope.file._id}, $scope.fileReversion).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Upload file reversion successfully");
                $scope.file = res;
            }, function(err) {$scope.showToast("Error");});
        }
    };

    // show file history
    $scope.isShowHistory = false;
    $scope.getFileHistory = function(history) {
        $scope.history = history;
        $scope.isShowHistory = true;
    };

    $scope.downloadFile = function() {
        if ($scope.history) {
            filepicker.exportFile(
                {url: $scope.history.link, filename: $scope.history.name},
                function(Blob){
                    console.log(Blob.url);
                }
            );
        } else {
            $scope.showToast("Error");
        }
    }

    getProjectMembers($stateParams.id);
});