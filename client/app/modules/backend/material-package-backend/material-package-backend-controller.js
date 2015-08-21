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
            _.remove(data, {_id: package._id});
            $scope.tableParams.reload();
        })
    };

    $scope.getEditPackage = function(package) {
        $scope.package = package;
        $scope.package.requirements = [];
        _.each($scope.package.addendums, function(addendum) {
            $scope.package.requirements.push({description: addendum.addendumsScope.description, quantity: addendum.addendumsScope.quantity, isNew: false});
        });
    };

    $scope.addDescriptionSupplier = function() {
        if ($scope.description && $scope.quantity) {
            $scope.package.requirements.push({description: $scope.description, quantity: $scope.quantity , isNew: true});
            $scope.description = '';
            $scope.quantity = '';
        }
    };

    $scope.removeDescriptionSupplier = function(index) {
        $scope.package.requirements.splice(index,1);
        $scope.description = '';
        $scope.quantity = '';
    };

    $scope.editPackage = function() {
        materialPackageService.updatePackage({id: $scope.package._id}, {package: $scope.package})
        .$promise.then(function(package){
            _.remove(data, {_id: $scope.package._id});
            fileService.getFileByPackage({id: package._id, type: 'material'}).$promise.then(function(files){
                package.documents = files.length;
            });
            taskService.getByPackage({id: package._id, type: 'material'}).$promise.then(function(tasks){
                package.tasks = tasks.length;
            });    
            messageService.getByPackage({id: package._id, type: 'material'}).$promise.then(function(threads){
                package.threads = threads.length;
            });
            data.push(package);
            $scope.tableParams.reload();
        });
    };
});