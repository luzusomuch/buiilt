angular.module('buiiltApp').controller('projectTaskDetailCtrl', function($rootScope, $scope, $timeout, task, taskService, $mdToast, $mdDialog) {
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

    $scope.updateTask = function(task, updateType) {
        taskService.update({id: task._id}, task).$promise.then(function(res) {
            if (updateType == "complete-task" || updateType == "uncomplete-task") {
                $scope.showToast((res.complete)?"Completed task successfully!":"Uncompleted task successfully!");
            } else if (updateType == "edit-task") {
                $scope.showToast("Updated task successfully!");
            } else if (updateTask == "assign") {
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
});