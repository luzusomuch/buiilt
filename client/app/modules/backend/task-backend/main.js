angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('taskBackend', {
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
});