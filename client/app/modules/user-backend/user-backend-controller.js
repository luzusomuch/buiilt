angular.module('buiiltApp').controller('UserBackendCtrl', function($scope, users, userService) {
    $scope.users = users;

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(data){
            $scope.users = data;
        })
    };
});