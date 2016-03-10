angular.module('buiiltApp')
.controller('ProjectBackendCtrl', function($state, $rootScope, $scope, projects, projectService, $mdDialog, $mdToast) {
    $scope.projects = projects;

    $scope.remove = function(project){
        var confirm = $mdDialog.confirm().title("Do you want to delete this project?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            projectService.delete({id: project._id}).$promise.then(function(){
                _.remove($scope.projects, {_id: project._id});
                $scope.showToast("Successfully");
            }, function(err){$scope.showToast("Error")});
        }, function() {
            
        });
    };

    $scope.editProject = function() {
        projectService.updateProject({id: $scope.project._id},$scope.project).$promise.then(function(project) {
            $scope.closeModal();
            $scope.showToast("Successfully");
            $rootScope.backendEditProject = null;
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.showModal = function($event, project){
        $rootScope.backendEditProject = project;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'ProjectBackendCtrl',
            resolve: {
                projects: ["projectService", function(projectService) {
                    return projectService.getAllProjects().$promise;
                }]
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