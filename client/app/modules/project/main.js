angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('project', {
    url: '/project',
    templateUrl: '/app/modules/project/project.html',
    controller: 'ProjectCtrl'
  })
  .state('project.form', {
    url : '/add',
    templateUrl: '/app/modules/project/create-project/form.html',
    controller: 'FormProjectCtrl',
  })
  .state('project.view', {
    url : '/:id',
    templateUrl: '/app/modules/project/view-project/view.html',
    controller: 'ViewProjectCtrl',
    resolve: {
      project: function($stateParams, projectService) {
        return projectService.get({ id :$stateParams.id});
      }
    }
  })
  ;
});