angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('documentBackend', {
    url: '/backend/document',
    templateUrl: '/app/modules/backend/document-backend/index.html',
    controller: 'DocumentBackendCtrl',
    authenticate: true,
    resolve: {
        documents: function(fileService) {
            return fileService.getAll().$promise;
        }
    }
  })
});