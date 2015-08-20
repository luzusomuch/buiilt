angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('dashboardBackend', {
        url: '/backend/dashboard',
        templateUrl: '/app/modules/backend/dashboard-backend/dashboard.html',
        controller: 'DashboardBackendCtrl',
        authenticate : true,
        resolve : {
            allProjects: function(projectService) {
                return projectService.getAllProjects();
            },
            allContractorPackages: function(contractorService) {
                return contractorService.getAll();
            },
            allMaterialPackages: function(materialPackageService) {
                return materialPackageService.getAll();
            },
            allUsers: function(userService) {
                return userService.getAll();
            },
            allDocuments: function(fileService) {
                return fileService.getAll();
            },
            allTasks: function(taskService) {
                return taskService.getAll();
            }
        }
    });
});