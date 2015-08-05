angular.module('buiiltApp').controller('ContractorPackageBackendCtrl', function(ngTableParams,$scope, contractorPackages, contractorService) {
    var data = contractorPackages;

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
        contractorService.delete({'id': package._id}).$promise.then(function(contractorPackages){
            data = contractorPackages;
        })
    };
});