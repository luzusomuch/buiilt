angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('dashboardBackend', {
        url: '/backend/dashboard',
        templateUrl: '/app/modules/backend/dashboard-backend/dashboard.html',
        controller: 'DashboardBackendCtrl',
        authenticate : true,
        isAdmin: true,
        resolve : {
            allProjects: function(projectService) {
                return projectService.getAllProjects();
            },
            allUsers: function(userService) {
                return userService.getAll();
            }
        }
    });
});