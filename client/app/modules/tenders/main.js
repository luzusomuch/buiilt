angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('tenders', {
    url: '/tenders',
  	abstract: true,
    templateUrl: '/app/modules/tenders/tenders.html',
    controller: 'TendersCtrl'
  })
  .state('tenders.open', {
    url: '/tenders/open',
    templateUrl: '/app/modules/tenders/tenders-open/tenders-open.html',
    controller: 'TendersCtrl'
  })
  .state('tenders.closed', {
    url: '/tenders/closed',
    templateUrl: '/app/modules/tenders/tenders-closed/tenders-closed.html',
    controller: 'TendersCtrl'
  });
});