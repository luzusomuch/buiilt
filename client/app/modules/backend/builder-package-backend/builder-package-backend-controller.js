angular.module('buiiltApp').controller('BuilderPackageBackendCtrl', function(ngTableParams, $filter,$scope, builderPackage, builderPackageService, fileService, taskService, messageService) {
    var data = [];

    fileService.getFileByPackage({id: builderPackage._id, type: 'builder'}).$promise.then(function(files){
        builderPackage.documents = files.length;
    });
    taskService.getByPackage({id: builderPackage._id, type: 'builder'}).$promise.then(function(tasks){
        builderPackage.tasks = tasks.length;
    });    
    messageService.getByPackage({id: builderPackage._id, type: 'builder'}).$promise.then(function(threads){
        builderPackage.threads = threads.length;
    });
    data.push(builderPackage);

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

    // $scope.remove = function(package){
    //     builderPackageService.delete({'id': package._id}).$promise.then(function(builderPackages){
    //         data = builderPackages;
    //     })
    // };
});