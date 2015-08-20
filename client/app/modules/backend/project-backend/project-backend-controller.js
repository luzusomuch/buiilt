angular.module('buiiltApp').controller('ProjectBackendCtrl', function($scope, projects, projectService,ngTableParams,$filter,contractorService,materialPackageService) {
    var data = projects;
    _.each(data, function(project) {
        contractorService.get({id: project._id}).$promise.then(function(packages){
            project.contractorPackages = packages.length;
        });
        materialPackageService.get({id: project._id}).$promise.then(function(packages){
            project.materialpackages = packages.length;
        });
    });
console.log(data);
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

    $scope.remove = function(project, index){
        projectService.delete({'id': project._id}).$promise.then(function(projects){
            data.splice(index, 1);
            // data = projects;
        })
    };
});