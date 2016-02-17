angular.module('buiiltApp')
.controller('ProjectBackendCtrl', function($state,$rootScope,$scope, projects, projectService,ngTableParams,$filter, $mdDialog, $mdToast) {
    var data = projects;
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
        });
    };

    $scope.getCurrentProject = function(project) {
        $scope.project = project;
    };
    $scope.editProject = function() {
        projectService.updateProject({id: $scope.project._id},$scope.project).$promise.then(function(project) {
            $scope.closeModal();
            $scope.showToast("Successfully");
            $rootScope.backendEditProject = null;
            _.remove(data, {_id: $scope.project._id});
            data.push(project);
            $scope.tableParams.reload();
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.showModal = function($event, name, project){
        $rootScope.backendEditProject = project;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'ProjectBackendCtrl',
            resolve: {
                projects: function(projectService) {
                    return projectService.getAllProjects().$promise;
                }
            },
            templateUrl: 'app/modules/backend/partials/edit-project-modal.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    if ($rootScope.backendEditProject) {
        $scope.project = $rootScope.backendEditProject;
    }
});