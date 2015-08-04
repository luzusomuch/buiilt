angular.module('buiiltApp').controller('ProjectBackendCtrl', function($scope, projects, projectService, authService,ngTableParams) {
    var data = projects;
    authService.getCurrentUser().$promise.then(function(user){
        $scope.currentUser = user;
    });

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 15           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(project){
        projectService.delete({'id': project._id}).$promise.then(function(projects){
            data = projects;
        })
    };
});