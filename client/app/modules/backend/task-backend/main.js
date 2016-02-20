angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('taskBackend', {
        url: '/backend/task',
        authenticate: true,
        isAdmin: true,
        template: '<ui-view/>'
    })
    .state('taskBackend.detail', {
        url: '/:taskId',
        templateUrl: '/app/modules/backend/task-backend/detail/view.html',
        controller: 'TaskDetailBackendCtrl',
        authenticate: true,
        isAdmin: true,
        resolve: {
            task: function(taskService, $stateParams) {
                return taskService.get({id: $stateParams.taskId, isAdmin: true}).$promise;
            }
        }
    })
});