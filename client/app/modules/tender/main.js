angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('tender', {
    url: '/tender/:tenderId',
  	abstract: true,
    templateUrl: '/app/modules/tender/tender.html',
    controller: 'TenderCtrl',
    resolve: {
      tender: function(tenderService, $stateParams) {
        return tenderService.get({id: $stateParams.tenderId}).$promise;
      }
    }
  })
  .state('tender.overview', {
    url: '/overview',
    templateUrl: '/app/modules/tender-overview/tender-overview.html',
    controller: 'TenderCtrl'
  })
  .state('tender.invitees', {
    url: '/invitees',
    templateUrl: '/app/modules/tender-invitees/tender-invitees.html',
    controller: 'TenderCtrl'
  })
  .state('tender.documents', {
    url: '/documents',
    templateUrl: '/app/modules/tender-documents/tender-documents.html',
    controller: 'TenderCtrl'
  });
});