angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('chatThreadsBackend', {
    url: '/backend/chat-thread',
    templateUrl: '/app/modules/backend/chat-thread-backend/view.html',
    controller: 'ChatThreadBackendCtrl',
    authenticate: true,
    resolve: {
        chatTheads: function(messageService) {
            return messageService.getAll().$promise;
        }
    }
  })
});