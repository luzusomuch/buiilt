angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('builder', {
    url: '/builder',
    templateUrl: '/app/modules/builder/builder.html',
    controller: 'BuilderCtrl'
  })
});