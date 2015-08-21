angular.module('buiiltApp').controller('ChatThreadBackendCtrl', function(ngTableParams,$scope, threads, messageService) {
    var data = threads;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(package){
        messageService.delete({'id': package._id}).$promise.then(function(threads){
            data = threads;
        })
    };
});