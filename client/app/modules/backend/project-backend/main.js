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
            },
            limitedProject: function(projectService) {
                return projectService.getProjectLimit().$promise;
            }
        }
    })
    .state("projectLimitBackend", {
        url: "/backend/projects/limit",
        templateUrl: "/app/modules/backend/project-backend/limit-project/index.html",
        controller: "ProjectBackendCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            projects: function(projectService) {
                return projectService.getAllProjects().$promise;
            },
            limitedProject: function(projectService) {
                return projectService.getProjectLimit().$promise;
            }
        }
    })
});