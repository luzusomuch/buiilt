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
            _.remove(data, {_id: package._id});
            $scope.tableParams.reload();
        })
    };

    $scope.getEditPackage = function(package) {
        $scope.package = package;
        $scope.package.descriptions = [];
        _.each($scope.package.addendums, function(addendum) {
            $scope.package.descriptions.push({description: addendum.addendumsScope.description, isNew: false});
        });
    };

    $scope.addDescriptionContractor = function(description) {
        if (description) {
            $scope.package.descriptions.push({description: description, isNew: true});
            $scope.description = '';
        }
    };

    $scope.removeDescriptionContractor = function(index) {
        $scope.package.descriptions.splice(index,1);
        $scope.description = '';
    };

    $scope.editPackage = function() {
        contractorService.updatePackage({id: $scope.package._id}, {package: $scope.package})
        .$promise.then(function(package){
            _.remove(data, {_id: $scope.package._id});
            fileService.getFileByPackage({id: package._id, type: 'contractor'}).$promise.then(function(files){
                package.documents = files.length;
            });
            taskService.getByPackage({id: package._id, type: 'contractor'}).$promise.then(function(tasks){
                package.tasks = tasks.length;
            });    
            messageService.getByPackage({id: package._id, type: 'contractor'}).$promise.then(function(threads){
                package.threads = threads.length;
            });
            data.push(package);
            $scope.tableParams.reload();
        });
    };
});