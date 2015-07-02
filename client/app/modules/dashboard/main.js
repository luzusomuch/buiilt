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
        'taskService',
        function(taskService) {
         return taskService.myTask().$promise
        }
      ],
      myThreads : [
        'messageService',
        function(messageService) {
          return messageService.myThread().$promise
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