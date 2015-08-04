angular.module('buiiltApp').controller('MaterialPackageBackendCtrl', function(ngTableParams,$scope, materialPackages, materialPackageService, authService) {
    var data = materialPackages;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 15           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(package){
        materialPackageService.delete({'id': package._id}).$promise.then(function(materialPackages){
            data = materialPackages;
        })
    };
});