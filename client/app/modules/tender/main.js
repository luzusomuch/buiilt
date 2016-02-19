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
    url: '/',
    abstract: true,
    templateUrl: '/app/modules/tender/tender-invitees/tender-invitees.html'
  })
  .state('tender.invitees.all', {
    url: 'invitees',
    templateUrl: '/app/modules/tender/tender-invitees/all/view.html',
    controller: 'tenderInviteesCtrl',
    authenticate : true
  })
  .state("tender.invitees.detail", {
    url: "invitees/:inviteeId/detail",
    templateUrl: "/app/modules/tender/tender-invitees/detail/tender-detail.html",
    controller: "tenderInviteeDetailCtrl",
    authenticate: true
  })
  .state('tender.documents', {
    url: '/',
    templateUrl: '/app/modules/tender/tender-documents/tender-documents.html',
    abstract: true
  })
  .state('tender.documents.all', {
    url: 'documents',
    templateUrl: '/app/modules/tender/tender-documents/all/view.html',
    controller: 'tenderDocumentsCtrl',
    authenticate : true
  })
  .state('tender.documents.detail', {
    url: 'document/:documentId/detail',
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