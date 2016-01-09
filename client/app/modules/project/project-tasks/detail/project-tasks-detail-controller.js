angular.module('buiiltApp').controller('projectTaskDetailCtrl', function($rootScope, $scope, $timeout, task, taskService, $mdToast) {
	$scope.task = task;
    if ($scope.task.belongTo) {
        switch ($scope.task.belongTo.type) {
            case "thread":
                $scope.task.belongTo.link = "project.messages.detail(id: "+$scope.task.project+", messageId: "+$scope.task.belongTo.item._id+")";
            break;

            case "task":
                $scope.task.belongTo.link = "project.tasks.detail(id: "+$scope.task.project+", taskId: "+$scope.task.belongTo.item._id+")";
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

    $scope.markComplete = function(task) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedBy = $rootScope.currentUser._id;
            task.editType = "complete-task";
            task.completedAt = new Date();
        } else {
            task.completedBy = null;
            task.editType = "uncomplete-task";
            task.completedAt = null;
        }
        taskService.update({id: task._id}, task).$promise.then(function(res) {
            $scope.showToast((res.complete)?"Completed task successfully!":"Uncompleted task successfully!");
            delete task.editType;
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };
});