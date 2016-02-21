angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('chatThreadsBackend', {
        url: '/backend/',
        authenticate: true,
        isAdmin: true,
        template: '<ui-view/>'
    })
    .state('chatThreadsBackend.detail', {
        url: 'thread/:messageId',
        templateUrl: '/app/modules/backend/chat-thread-backend/detail/view.html',
        controller: 'ChatThreadDetailBackendCtrl',
        authenticate: true,
        isAdmin: true,
        resolve: {
            thread: function(messageService, $stateParams) {
                return messageService.get({id: $stateParams.messageId}).$promise;
            }
        }
    })
});