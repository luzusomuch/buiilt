angular.module('buiiltApp')
.controller('ProjectBackendCtrl', function($state,authService,$rootScope,$scope, projects, projectService,ngTableParams,$filter,contractorService,materialPackageService) {
    var data = projects;

    _.each(data, function(project) {
        contractorService.get({id: project._id}).$promise.then(function(packages){
            project.contractorPackages = packages.length;
        });
        materialPackageService.get({id: project._id}).$promise.then(function(packages){
            project.materialpackages = packages.length;
        });
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
    $scope.remove = function(project, index){
        projectService.delete({'id': project._id}).$promise.then(function(projects){
            _.remove(data, {_id: project._id});
            $scope.tableParams.reload();
        })
    };

    $scope.getCurrentProject = function(project) {
        $scope.project = project;
    };
    $scope.editProject = function() {
        projectService.updateProject({id: $scope.project._id},{project: $scope.project}).$promise.then(function(project) {
            _.remove(data, {_id: $scope.project._id});
            contractorService.get({id: project._id}).$promise.then(function(packages){
                project.contractorPackages = packages.length;
            });
            materialPackageService.get({id: project._id}).$promise.then(function(packages){
                project.materialpackages = packages.length;
            });
            data.push(project);
            $scope.tableParams.reload();
        });
    };
});