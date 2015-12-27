angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
	
    .state('dashboard', {
  	url: '/dashboard',
	abstract:true,
  	templateUrl: '/app/modules/dashboard/dashboard.html',
  	controller: 'dashboardCtrl',
  	authenticate : true
    })
	
    .state('dashboard.tasks', {
  	url: '/tasks',
  	templateUrl: '/app/modules/dashboard/partials/dashboard-tasks.html',
  	controller: 'dashboardCtrl',
  	authenticate : true
    })
	
    .state('dashboard.messages', {
  	url: '/messages',
  	templateUrl: '/app/modules/dashboard/partials/dashboard-messages.html',
  	controller: 'dashboardCtrl',
  	authenticate : true
    })
	
    .state('dashboard.files', {
  	url: '/files',
  	templateUrl: '/app/modules/dashboard/partials/dashboard-files.html',
  	controller: 'dashboardCtrl',
  	authenticate : true
    })
	
    .state('dashboard.documentation', {
  	url: '/documentation',
  	templateUrl: '/app/modules/dashboard/partials/dashboard-documentation.html',
  	controller: 'dashboardCtrl',
  	authenticate : true
    });
	
	
	
  // .state('dashboardOld', {
//     url: '/:id/dashboardOld',
//     templateUrl: '/app/modules/dashboard/dashboard.html',
//     controller: 'DashboardCtrl',
//     hasCurrentProject : true,
//     authenticate : true,
//     resolve : {
//       myTasks : [
//         'taskService','$stateParams',
//         function(taskService,$stateParams) {
//           return taskService.myTask({id : $stateParams.id}).$promise;
//         }
//       ],
//       myThreads : [
//         'messageService','$stateParams',
//         function(messageService,$stateParams) {
//           return messageService.myThread({id : $stateParams.id}).$promise;
//         }
//       ],
//       // myFiles: function($stateParams, notificationService){
//         // return notificationService.getMyFile({'id':$stateParams.id}).$promise;
//       // }
//     }
//   })


});