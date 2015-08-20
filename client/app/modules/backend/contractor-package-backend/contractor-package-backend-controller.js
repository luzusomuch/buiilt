angular.module('buiiltApp').controller('ContractorPackageBackendCtrl', function(fileService,taskService,messageService,ngTableParams,$scope, contractorPackages, contractorService,$filter) {
    var data = contractorPackages;
    _.each(data, function(contractorPackage){
        fileService.getFileByPackage({id: contractorPackage._id, type: 'contractor'}).$promise.then(function(files){
            contractorPackage.documents = files.length;
        });
        taskService.getByPackage({id: contractorPackage._id, type: 'contractor'}).$promise.then(function(tasks){
            contractorPackage.tasks = tasks.length;
        });    
        messageService.getByPackage({id: contractorPackage._id, type: 'contractor'}).$promise.then(function(threads){
            contractorPackage.threads = threads.length;
        })
    });

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,           // count per page
        sorting: {
            name: 'asc'     // initial sorting
        }
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            var orderedData = params.sorting() ?
                    $filter('orderBy')(data, params.orderBy()) :
                    data;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(package){
        contractorService.delete({'id': package._id}).$promise.then(function(contractorPackages){
            data = contractorPackages;
        })
    };
});