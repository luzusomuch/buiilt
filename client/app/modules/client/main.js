angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('client', {
    url: '/client',
    templateUrl: '/app/modules/client/client.html',
    controller: 's'
  });
});