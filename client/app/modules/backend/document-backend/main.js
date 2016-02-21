angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('documentBackend', {
        url: '/backend/',
        template: '<ui-view/>'
    })
    .state('documentBackend.detail', {
        url: 'document/:documentId',
        templateUrl: '/app/modules/backend/document-backend/detail/view.html',
        controller: 'DocumentDetailBackendCtrl',
        authenticate: true,
        isAdmin: true,
        resolve: {
          document: function(fileService, $stateParams) {
            return fileService.get({id: $stateParams.documentId}).$promise;
          }
        }
    })
});