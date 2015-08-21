angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('taskBackend', {
    url: '/backend/:id/task',
    authenticate: true,
    backendHasCurrentProject: true,
    template: '<ui-view/>'
  })
  .state('taskBackend.list', {
    url: '/list/:packageId/:type',
    templateUrl: '/app/modules/backend/task-backend/view.html',
    controller: 'TaskBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        tasks: function(taskService,$stateParams) {
            return taskService.getByPackage({id: $stateParams.packageId, type: $stateParams.type}).$promise;
        }
    }
  })
  .state('taskBackend.detail', {
    url: '/:taskId/:type',
    templateUrl: '/app/modules/backend/task-backend/detail/view.html',
    controller: 'TaskDetailBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        task: function(taskService, $stateParams) {
            return taskService.getOne({id: $stateParams.taskId, type: $stateParams.type}).$promise;
        }
    }
  })
});