angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('documentBackend', {
    url: '/backend/document',
    authenticate : true,
    template: '<ui-view/>'
  })
  .state('documentBackend.list', {
    url: '/list/:packageId/:type',
    templateUrl: '/app/modules/backend/document-backend/index.html',
    controller: 'DocumentBackendCtrl',
    authenticate: true,
    resolve: {
        documents: function(fileService, $stateParams) {
            return fileService.getFileByPackage({id: $stateParams.id, type: $stateParams.type}).$promise;
        }
    }
  })
  .state('documentBackend.detail', {
    url: '/:documentId',
    templateUrl: '/app/modules/backend/document-backend/detail/view.html',
    controller: 'DocumentDetailBackendCtrl',
    authenticate: true,
    resolve: {
      document: function(fileService, $stateParams) {
        return fileService.get({id: $stateParams.documentId}).$promise;
      }
    }
  })
});