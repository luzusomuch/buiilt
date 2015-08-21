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

    $scope.remove = function(thread){
        messageService.delete({'id': thread._id}).$promise.then(function(threads){
            _.remove(data, {_id: thread._id});
            $scope.tableParams.reload();
        })
    };
});