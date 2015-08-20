angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('threadBackend', {
    url: '/backend/thread',
    authenticate: true,
    template: '<ui-view/>'
  })
  .state('threadBackend.list', {
    url: '/backend/thread',
    templateUrl: '/app/modules/backend/thread-backend/view.html',
    controller: 'ThreadBackendCtrl',
    authenticate: true,
    resolve: {
        tasks: function(taskService) {
            return taskService.getAll().$promise;
        }
    }
  })
  .state('threadBackend.detail', {
    url: '/:taskId/:type',
    templateUrl: '/app/modules/backend/thread-backend/detail/view.html',
    controller: 'ThreadDetailBackendCtrl',
    authenticate: true,
    resolve: {
        task: function(taskService, $stateParams) {
            return taskService.getOne({id: $stateParams.taskId, type: $stateParams.type}).$promise;
        }
    }
  })
});