angular.module('buiiltApp').controller('ProjectBackendCtrl', function($scope, projects, userService, authService) {
    $scope.projects = projects;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(data){
            $scope.users = data;
        })
    };
});