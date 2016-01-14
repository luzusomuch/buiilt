angular.module('buiiltApp').controller('projectFileDetailCtrl', function($scope, $rootScope, file, $mdDialog, uploadService, fileService, $mdToast, peopleService, $stateParams, messageService, taskService, $state) {
	$scope.file = file;
    $scope.isShowRelatedItem = true;

    $scope.showRelatedItem = function() {
        $scope.isShowRelatedItem = !$scope.isShowRelatedItem;
    };

    $scope.$watch("isShowRelatedItem", function(value) {

    });

    function getProjectMembers(id) {
        $scope.membersList = [];
        peopleService.getInvitePeople({id: id}).$promise.then(function(people) { 
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
        });
        // get invitees for related item
        $scope.invitees = $scope.file.members;
        $scope.invitees.push($scope.file.owner);
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.showModal = function($event, modalName) {
        if (modalName === "add-related-thread.html") {
            $scope.relatedThread = {};
        } else if (modalName === "add-related-task.html") {
            $scope.minDate = new Date();
            $scope.relatedTask = {};
        } else if (modalName === "add-related-file.html") {
            $scope.relatedFile = {};
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectFileDetailCtrl',
            resolve: {
                file: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.fileId}).$promise;
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


    getProjectMembers($stateParams.id);
});