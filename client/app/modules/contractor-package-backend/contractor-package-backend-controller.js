angular.module('buiiltApp').controller('ContractorPackageBackendCtrl', function($scope, contractorPackages, userService, authService) {
    $scope.contractorPackages = contractorPackages;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(data){
            $scope.users = data;
        })
    };
});