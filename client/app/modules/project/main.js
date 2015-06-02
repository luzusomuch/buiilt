angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('projects', {
    url: '/projects',
    template: '<ui-view/>'
  })
  .state('projects.list', {
    url: '/',
    templateUrl: '/app/modules/project/list-projects/list-projects.html',
    controller: 'ProjectListCtrl'
  })
  .state('projects.create', {
    url: '/create',
    templateUrl: '/app/modules/project/create-project/create-project.html',
    controller: 'CreateProjectCtrl'
  })
  .state('projects.view', {
    url: '/:id',
    templateUrl: '/app/modules/project/view-project/view.html',
    controller: 'ViewProjectCtrl',
    resolve: {
      project: function($stateParams, projectService) {
        return projectService.get({id: $stateParams.id});
      }
    }
  });
});