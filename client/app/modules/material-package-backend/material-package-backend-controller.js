angular.module('buiiltApp').controller('MaterialPackageBackendCtrl', function($scope, materialPackages, userService, authService) {
    $scope.materialPackages = materialPackages;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(data){
            $scope.users = data;
        })
    };
});