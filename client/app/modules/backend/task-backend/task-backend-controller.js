angular.module('buiiltApp').controller('TaskBackendCtrl', function(ngTableParams,$scope, tasks, taskService) {
    var data = tasks;
    console.log(data);

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 15           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(task){
        taskService.delete({'id': task._id}).$promise.then(function(tasks){
            _.remove(data, {_id: task._id});
            $scope.tableParams.reload();
        })
    };
});