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
    templateUrl: '/app/modules/tender/tender-overview/tender-overview.html',
    controller: 'tenderOverviewCtrl',
    authenticate : true
  })
  .state('tender.invitees', {
    url: '/invitees',
    templateUrl: '/app/modules/tender/tender-invitees/tender-invitees.html',
    controller: 'tenderInviteesCtrl',
    authenticate : true
  })
  .state('tender.documents', {
    url: '/documents',
    templateUrl: '/app/modules/tender/tender-documents/tender-documents.html',
    controller: 'tenderDocumentsCtrl',
    authenticate : true
  })
  .state('tender.documents.detail', {
    url: '/:documentId/detail',
    templateUrl: '/app/modules/tender/tender-documents/detail/document-detail.html',
    controller: 'tenderDocumentDetailCtrl',
    authenticate: true,
    resolve: {
      document: function($stateParams, fileService) {
        return fileService.get({id: $stateParams.documentId}).$promise;
      }
    }
  });
});