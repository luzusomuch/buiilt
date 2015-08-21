angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('documentBackend', {
    url: '/backend/:id/document',
    authenticate : true,
    backendHasCurrentProject: true,
    template: '<ui-view/>'
  })
  .state('documentBackend.list', {
    url: '/list/:packageId/:type',
    templateUrl: '/app/modules/backend/document-backend/index.html',
    controller: 'DocumentBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        documents: function(fileService, $stateParams) {
            return fileService.getFileByPackage({id: $stateParams.packageId, type: $stateParams.type}).$promise;
        }
    }
  })
  .state('documentBackend.detail', {
    url: '/:documentId',
    templateUrl: '/app/modules/backend/document-backend/detail/view.html',
    controller: 'DocumentDetailBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
      document: function(fileService, $stateParams) {
        return fileService.get({id: $stateParams.documentId}).$promise;
      }
    }
  })
});