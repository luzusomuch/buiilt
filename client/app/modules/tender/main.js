angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('tender', {
    url: '/tender',
  	abstract: true,
    templateUrl: '/app/modules/tender/tender.html',
    controller: 'TenderCtrl'
  })
  .state('tender.overview', {
    url: '/tender/overview',
    templateUrl: '/app/modules/tender-overview/tender-overview.html',
    controller: 'TenderCtrl'
  })
  .state('tender.invitees', {
    url: '/tender/invitees',
    templateUrl: '/app/modules/tender-invitees/tender-invitees.html',
    controller: 'TenderCtrl'
  })
  .state('tender.documents', {
    url: '/tender/documents',
    templateUrl: '/app/modules/tender-documents/tender-documents.html',
    controller: 'TenderCtrl'
  });
});