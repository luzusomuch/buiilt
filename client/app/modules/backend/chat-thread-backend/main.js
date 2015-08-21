angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('chatThreadsBackend', {
    url: '/backend/chat-thread',
    authenticate: true,
    template: '<ui-view/>'
  })
  .state('chatThreadsBackend.list', {
    url: '/list/:packageId/:type',
    templateUrl: '/app/modules/backend/chat-thread-backend/view.html',
    controller: 'ChatThreadBackendCtrl',
    authenticate: true,
    resolve: {
        threads: function(messageService,$stateParams) {
            return messageService.getByPackage({id: $stateParams.packageId, type: $stateParams.type}).$promise;
        }
    }
  })
  .state('chatThreadsBackend.detail', {
    url: '/:threadId/:type',
    templateUrl: '/app/modules/backend/chat-thread-backend/detail/view.html',
    controller: 'ChatThreadDetailBackendCtrl',
    authenticate: true,
    resolve: {
        thread: function(messageService, $stateParams) {
            return messageService.getOne({id: $stateParams.threadId, type: $stateParams.type}).$promise;
        }
    }
  })
});