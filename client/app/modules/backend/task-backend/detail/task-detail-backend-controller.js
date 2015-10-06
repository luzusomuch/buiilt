angular.module('buiiltApp').controller('TaskDetailBackendCtrl', function($scope, task, taskService) {
    $scope.task = task;

    $scope.remove = function(task){
        taskService.delete({'id': task._id}).$promise.then(function(tasks){
            data = tasks;
        });
    };
});