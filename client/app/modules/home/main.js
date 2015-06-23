angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('home', {
    url: '/',
    templateUrl: '/app/modules/home/home.html',
    controller: 'HomeCtrl',
    authenticate : true,
    resolve : {
      projectsByUser : [
        'projectService',
        function(projectService) {
          return projectService.getProjectsByUser({id : '556eab50d3e74fd8125a59f6'}).$promise;
        }
      ],
      projectsByBuilder : [
        'projectService',
        function(projectService) {
          return projectService.getProjectsByBuilder({id : '556eab50d3e74fd8125a59f6'}).$promise;
        }
      ]
    }
  });
});