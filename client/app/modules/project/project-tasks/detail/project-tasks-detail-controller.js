angular.module('buiiltApp').controller('projectTaskDetailCtrl', function($rootScope, $scope, $timeout, task, taskService, $mdToast, $mdDialog, peopleService, $stateParams) {
	$scope.task = task;
    $scope.task.dateEnd = new Date($scope.task.dateEnd);
    $scope.minDate = new Date();
    if ($scope.task.belongTo) {
        switch ($scope.task.belongTo.type) {
            case "thread":
                $scope.task.belongTo.link = "/project/"+$scope.task.project+"/messages/detail/"+$scope.task.belongTo.item._id;
            break;

            case "task":
                $scope.task.belongTo.link = "/project/"+$scope.task.project+"/tasks/detail/"+$scope.task.belongTo.item._id;
            break;

            default:
            break;
        }
    }
    $scope.orginalActivities = angular.copy($scope.task.activities);

    $scope.isShowRelativeActivities = true;
    $scope.showRelatedActivities = function() {
        $scope.isShowRelativeActivities = !$scope.isShowRelativeActivities;
    };
    $scope.$watch("isShowRelativeActivities", function(value) {
        var activities = [];
        if (!value) {
            _.each($scope.orginalActivities, function(activity) {
                if (activity.type === "complete-task" || activity.type === "uncomplete-task" || activity.type === "edit-task" || activity.type === "assign") {
                    activities.push(activity);
                }
            });
            $scope.task.activities = activities;
        } else {
            $scope.task.activities = $scope.orginalActivities;
        }
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
            _.each(task.members, function(member) {
                _.remove($scope.membersList, {_id: member._id});
            });

            // remove current user from the members list
            _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
        });

        // get invitees for related item
        $scope.invitees = $scope.task.members;
        $scope.invitees.push($scope.task.owner);
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.markComplete = function() {
        $scope.task.completed = !$scope.task.completed;
        if ($scope.task.completed) {
            $scope.task.completedBy = $rootScope.currentUser._id;
            $scope.task.editType = "complete-task";
            $scope.task.completedAt = new Date();
        } else {
            $scope.task.completedBy = null;
            $scope.task.editType = "uncomplete-task";
            $scope.task.completedAt = null;
        }
        $scope.updateTask($scope.task, $scope.task.editType);
    };

    $scope.showModal = function($event, modalName){
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectTaskDetailCtrl',
            resolve: {
                task: function($stateParams, taskService) {
                    return taskService.get({id: $stateParams.taskId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-tasks/detail/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.editTaskDetail = function(form) {
        if (form.$valid) {
            $scope.task.editType = "edit-task";
            $scope.updateTask($scope.task, $scope.task.editType);
        } else {
            $scope.showToast("Please check your input again");
            return;
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
        $scope.task.newMembers = _.filter($scope.membersList, {select: true});
        if ($scope.task.newMembers.length > 0) {
            $scope.task.editType = "assign";
            $scope.updateTask($scope.task, $scope.task.editType);
        } else {
            $scope.showToast("Please select at least 1 member");
            return false;
        }
    };

    $scope.updateTask = function(task, updateType) {
        taskService.update({id: task._id}, task).$promise.then(function(res) {
            if (updateType == "complete-task" || updateType == "uncomplete-task") {
                $scope.showToast((res.complete)?"Completed task successfully!":"Uncompleted task successfully!");
            } else if (updateType == "edit-task") {
                $scope.showToast("Updated task successfully!");
            } else if (updateType == "assign") {
                $scope.showToast("Assign more people successfully!");
            }
            delete task.editType;
            $scope.task = res;
            $scope.closeModal();
        }, function(err) {
            $scope.showToast("Error");
            delete task.editType;
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    getProjectMembers($stateParams.id);
});