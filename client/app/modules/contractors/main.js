angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractors', {
    url: '/contractors',
    templateUrl: '/app/modules/contractors/contractors.html',
    controller: 'ContractorsCtrl'
  });
});