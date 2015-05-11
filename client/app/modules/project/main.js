angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('project', {
    url: '/project',
    templateUrl: '/app/modules/project/project.html',
    controller: 'ProjectCtrl'
  });
});