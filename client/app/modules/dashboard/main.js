angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
	
    .state('dashboard', {
      	url: '/dashboard',
    	abstract:true,
      	templateUrl: '/app/modules/dashboard/dashboard.html',
      	controller: 'dashboardCtrl',
      	authenticate : true,
        resolve: {
            myTasks: function(taskService) {
                return taskService.myTask().$promise;
            },
            myMessages: function(messageService) {
                return messageService.myMessages().$promise;
            },
            myFiles: function(fileService) {
                return fileService.myFiles().$promise;
            }
        }
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
});