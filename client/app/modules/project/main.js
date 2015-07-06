angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('projects', {
    url: '/projects',
	authenticate : true,
    template: '<ui-view/>',
    resolve: {
      homeOwnerTeam : [
        'teamService',
        function(teamService) {
          return teamService.getHomeOwnerTeam();
        }
      ]
    }
  })
  .state('projects.list', {
    url: '/',
    templateUrl: '/app/modules/project/list-projects/list-projects.html',
    controller: 'ProjectListCtrl',
    authenticate : true
  })
  .state('projects.create', {
    url: '/create',
    templateUrl: '/app/modules/project/create-project/create-project.html',
    controller: 'CreateProjectCtrl',
    authenticate : true
  })
  .state('projects.view', {
    url: '/:id',
    templateUrl: '/app/modules/project/view-project/view.html',
    controller: 'ViewProjectCtrl',
    authenticate : true,
    resolve: {
      project: function($stateParams, projectService) {
        return projectService.get({id: $stateParams.id});
      }
    },
    hasCurrentProject : true
  });
});