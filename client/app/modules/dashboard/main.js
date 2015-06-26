angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('dashboard', {
    url: '/:id/dashboard',
    templateUrl: '/app/modules/dashboard/dashboard.html',
    controller: 'DashboardCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve : {
      myTask : function(taskService) {
        return taskService.myTask().$promise
      }
    }
  });
});