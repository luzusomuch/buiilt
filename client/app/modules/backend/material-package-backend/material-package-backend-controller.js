angular.module('buiiltApp').controller('MaterialPackageBackendCtrl', function($filter,fileService,taskService,messageService,ngTableParams,$scope, materialPackages, materialPackageService) {
    var data = materialPackages;
    _.each(data, function(materialPackage){
        fileService.getFileByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(files){
            materialPackage.documents = files.length;
        });
        taskService.getByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(tasks){
            materialPackage.tasks = tasks.length;
        });    
        messageService.getByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(threads){
            materialPackage.threads = threads.length;
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
        materialPackageService.delete({'id': package._id}).$promise.then(function(materialPackages){
            data = materialPackages;
        })
    };
});