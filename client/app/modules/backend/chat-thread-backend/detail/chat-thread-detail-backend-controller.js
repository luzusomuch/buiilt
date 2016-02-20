angular.module('buiiltApp').controller('ChatThreadDetailBackendCtrl', function($scope, thread) {
    $scope.thread = thread;
    $scope.assignees = thread.members;
    _.each(thread.notMembers, function(email) {
        $scope.assignees.push({email: email});
    });
});