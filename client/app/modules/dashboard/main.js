angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('dashboard', {
    url: '/:id/dashboard',
    templateUrl: '/app/modules/dashboard/dashboard.html',
    controller: 'DashboardCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve : {
      myTasks : [
        'taskService','$stateParams',
        function(taskService,$stateParams) {
         return taskService.myTask({id : $stateParams.id}).$promise
        }
      ],
      myThreads : [
        'messageService','$stateParams',
        function(messageService,$stateParams) {
          return messageService.myThread({id : $stateParams.id}).$promise
        }
      ],
      // myFiles : [
      //   'notificationService',
      //   function(notificationService, $stateParams) {
      //    return notificationService.getMyFile({'id': stateParams.id}).$promise
      //   }
      // ],
      myFiles: function($stateParams, notificationService){
        return notificationService.getMyFile({'id':$stateParams.id}).$promise;
      }
    }
  });
});