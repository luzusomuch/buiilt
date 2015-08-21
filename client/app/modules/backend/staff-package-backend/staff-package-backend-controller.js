angular.module('buiiltApp').controller('StaffPackageBackendCtrl', function(messageService,taskService,fileService,$filter,ngTableParams,$scope, staffPackages, staffPackageService) {
    var data = staffPackages;
    _.each(data, function(staffPackage){
        fileService.getFileByPackage({id: staffPackage._id, type: 'staff'}).$promise.then(function(files){
            staffPackage.documents = files.length;
        });
        taskService.getByPackage({id: staffPackage._id, type: 'staff'}).$promise.then(function(tasks){
            staffPackage.tasks = tasks.length;
        });    
        messageService.getByPackage({id: staffPackage._id, type: 'staff'}).$promise.then(function(threads){
            staffPackage.threads = threads.length;
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
        staffPackageService.delete({'id': package._id}).$promise.then(function(staffPackages){
            _.remove(data, {_id: package._id});
            $scope.tableParams.reload();
        })
    };

    $scope.getEditPackage = function(package) {
        $scope.package = package;
    };

    $scope.addDescription = function(description) {
        if (description) {
            $scope.package.descriptions.push(description);
            $scope.description = '';
        }
    };

    $scope.removeDescription = function(index) {
        $scope.package.descriptions.splice(index,1);
        $scope.description = '';
    };

    $scope.editPackage = function() {
        staffPackageService.updatePackage({id: $scope.package._id}, {package: $scope.package})
        .$promise.then(function(package){
            _.remove(data, {_id: $scope.package._id});
            fileService.getFileByPackage({id: package._id, type: 'staff'}).$promise.then(function(files){
                package.documents = files.length;
            });
            taskService.getByPackage({id: package._id, type: 'staff'}).$promise.then(function(tasks){
                package.tasks = tasks.length;
            });    
            messageService.getByPackage({id: package._id, type: 'staff'}).$promise.then(function(threads){
                package.threads = threads.length;
            });
            data.push(package);
            $scope.tableParams.reload();
        });
    };
});