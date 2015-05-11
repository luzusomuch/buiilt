angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('tender', {
    url: '/tender',
    templateUrl: '/app/modules/tender/tender.html',
    controller: 'TenderCtrl'
  });
});