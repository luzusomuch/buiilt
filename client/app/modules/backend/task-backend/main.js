angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('taskBackend', {
    url: '/backend/task',
    authenticate: true,
    template: '<ui-view/>'
  })
  .state('taskBackend.list', {
    url: '/backend/task',
    templateUrl: '/app/modules/backend/task-backend/view.html',
    controller: 'TaskBackendCtrl',
    authenticate: true,
    resolve: {
        tasks: function(taskService) {
            return taskService.getAll().$promise;
        }
    }
  })
  .state('taskBackend.detail', {
    url: '/:taskId/:type',
    templateUrl: '/app/modules/backend/task-backend/detail/view.html',
    controller: 'TaskDetailBackendCtrl',
    authenticate: true,
    resolve: {
        task: function(taskService, $stateParams) {
            return taskService.getOne({id: $stateParams.taskId, type: $stateParams.type}).$promise;
        }
    }
  })
});