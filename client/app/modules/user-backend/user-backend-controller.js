angular.module('buiiltApp').controller('UserBackendCtrl', function($scope, users, userService, authService) {
    $scope.users = users;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(data){
            $scope.users = data;
        })
    };
});