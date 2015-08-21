angular.module('buiiltApp').controller('UserBackendCtrl', function(ngTableParams,$scope, users, userService) {
    var data = users;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(users){
            _.remove(data, {_id: user._id});
            $scope.tableParams.reload();
        })
    };
});