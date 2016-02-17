angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('projectsBackend', {
        url: '/backend/projects',
        templateUrl: '/app/modules/backend/project-backend/index.html',
        controller: 'ProjectBackendCtrl',
        authenticate: true,
        isAdmin: true,
        resolve: {
            projects: function(projectService) {
                return projectService.getAllProjects().$promise;
            }
        }
    })
});