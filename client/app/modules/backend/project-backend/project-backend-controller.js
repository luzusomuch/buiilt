angular.module('buiiltApp').controller('ProjectBackendCtrl', function($scope, projects, projectService,ngTableParams,$filter) {
    var data = projects;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 15,           // count per page
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

    $scope.remove = function(project){
        projectService.delete({'id': project._id}).$promise.then(function(projects){
            data = projects;
        })
    };
});