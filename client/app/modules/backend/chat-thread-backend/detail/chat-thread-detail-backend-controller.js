angular.module('buiiltApp').controller('ChatThreadDetailBackendCtrl', function(ngTableParams,$scope, thread, messageService) {
    $scope.thread = thread;
    var data = thread.messages;
    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    // $scope.remove = function(task){
    //     messageService.delete({'id': task._id}).$promise.then(function(tasks){
    //         data = tasks;
    //     })
    // };
});