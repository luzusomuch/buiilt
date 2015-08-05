angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('chatThreadsBackend', {
    url: '/backend/chat-thread',
    authenticate: true,
    template: '<ui-view/>'
  })
  .state('chatThreadsBackend.list', {
    url: '/list',
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