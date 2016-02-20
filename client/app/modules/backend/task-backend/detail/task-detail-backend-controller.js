angular.module('buiiltApp').controller('TaskDetailBackendCtrl', function($scope, task) {
    $scope.task = task;
    $scope.assignees = task.members;
    _.each(task.notMembers, function(email) {
        $scope.assignees.push({email: email});
    });
});