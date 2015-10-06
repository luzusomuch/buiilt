angular.module('buiiltApp').controller('DocumentBackendCtrl', function($scope, documents, fileService,ngTableParams) {
    var data = documents;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(value){
        fileService.delete({'id': value._id}).$promise.then(function(documents){
            _.remove(data, {_id: value._id});
            $scope.tableParams.reload();
        });
    };
});