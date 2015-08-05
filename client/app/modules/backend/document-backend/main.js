angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('documentBackend', {
    url: '/backend/document',
    hasCurrentProject : true,
    authenticate : true,
    template: '<ui-view/>'
  })
  .state('documentBackend.list', {
    url: '/list',
    templateUrl: '/app/modules/backend/document-backend/index.html',
    controller: 'DocumentBackendCtrl',
    authenticate: true,
    resolve: {
        documents: function(fileService) {
            return fileService.getAll().$promise;
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
        console.log('asdasdasd');
        console.log($stateParams.documentId);
        return fileService.get({id: $stateParams.documentId}).$promise;
      }
    }
  })
});