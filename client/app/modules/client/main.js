angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('client', {
    url: '/:id/client',
    templateUrl: '/app/modules/client/client.html',
    controller: 'ClientCtrl',
    hasCurrentProject : true
  });
});