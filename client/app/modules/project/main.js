angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
	
	//Parents State for Singular Project
  .state('project', {
  	url: '/project/:id',
  	templateUrl: '/app/modules/project/project.html',
  	controller: 'projectCtrl',
  	authenticate : true,
    resolve: {
      people: function(peopleService, $stateParams) {
        return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
      }
    }
  })

  .state("project.event", {
    url: "/event",
    abstract: true,
    templateUrl: '/app/modules/project/project-calendar/view.html',
  })
  .state("project.event.overview", {
    url: "/overview",
    templateUrl: "/app/modules/project/project-calendar/overview/project-calendar-overview.html",
    controller: "projectCalendarCtrl",
    authenticate: true,
    resolve: {
      activities: function($stateParams, activityService) {
        return activityService.me({id: $stateParams.id}).$promise;
      }
    }
  })
  .state("project.event.activity", {
    url: "/detail/:activityId",
    templateUrl: "/app/modules/project/project-calendar/detail/project-calendar-detail.html",
    controller: "projectCalendarDetailCtrl",
    authenticate: true,
    resolve: {
      activity: function($stateParams, activityService) {
        return activityService.get({id: $stateParams.activityId}).$promise;
      },
      activities: function($stateParams, activityService) {
        return activityService.me({id: $stateParams.id}).$promise;
      },
    }
  })
  
  	//Overview of Single Project
  .state('project.overview', {
    url: '/overview',
    templateUrl: '/app/modules/project/project-overview/project-overview.html',
    controller: 'projectCtrl',
    authenticate : true
  })
  	
	//Team for Single Project
  .state('project.team', {
    url: '/team',
	  abstract: true,
    templateUrl: '/app/modules/project/project-team/project-team.html',
    controller: 'projectTeamCtrl',
    authenticate : true
  })
  .state('project.team.all', {
    url: '/',
    templateUrl: '/app/modules/project/project-team/all/project-team-all.html',
    controller: 'projectTeamCtrl',
    authenticate : true
  })
  
  	//Messages for Single Project
  .state('project.messages', {
    url: '/messages',
	  abstract: true,
    templateUrl: '/app/modules/project/project-messages/project-messages.html',
    controller: 'projectMessagesCtrl',
    authenticate : true,
    resolve: {
      threads: function($stateParams, messageService) {
        return messageService.getProjectThread({id: $stateParams.id}).$promise;
      }
    }
  })
  .state('project.messages.all', {
    url: '',
    templateUrl: '/app/modules/project/project-messages/all/project-messages-all.html',
    controller: 'projectMessagesCtrl',
    authenticate : true
  })
  .state('project.messages.detail', {
    url: '/detail/:messageId',
    templateUrl: '/app/modules/project/project-messages/detail/project-messages-detail.html',
    controller: 'projectMessagesDetailCtrl',
    authenticate : true,
    resolve: {
      thread: function($stateParams, messageService) {
        return messageService.get({id: $stateParams.messageId}).$promise;
      }
    }
  })
  
  	//Tasks for Single Project
  .state('project.tasks', {
    url: '/tasks',
	  abstract: true,
    templateUrl: '/app/modules/project/project-tasks/project-tasks.html',
    controller: 'projectTasksCtrl',
    authenticate : true,
    resolve: {
      tasks: function(taskService, $stateParams) {
        return taskService.getProjectTask({id: $stateParams.id}).$promise;
      }
    }
  })
  .state('project.tasks.all', {
    url: '',
    templateUrl: '/app/modules/project/project-tasks/all/project-tasks-all.html',
    controller: 'projectTasksCtrl',
    authenticate : true
  })
  .state('project.tasks.detail', {
    url: '/detail/:taskId',
    templateUrl: '/app/modules/project/project-tasks/detail/project-tasks-detail.html',
    controller: 'projectTaskDetailCtrl',
    authenticate : true,
    resolve: {
      task: function($stateParams, taskService) {
        return taskService.get({id: $stateParams.taskId}).$promise;
      }
    }
  })
  
  	//Files for Single Project
  .state('project.files', {
    url: '/files',
	  abstract: true,
    templateUrl: '/app/modules/project/project-files/project-files.html',
    controller: 'projectFilesCtrl',
    authenticate : true,
    resolve: {
      files: function($stateParams, fileService) {
        return fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise;
      }
    }
  })
  .state('project.files.all', {
    url: '',
    templateUrl: '/app/modules/project/project-files/all/project-files-all.html',
    controller: 'projectFilesCtrl',
    authenticate : true
  })
  .state('project.files.detail', {
    url: '/detail/:fileId',
    templateUrl: '/app/modules/project/project-files/detail/project-files-detail.html',
    controller: 'projectFileDetailCtrl',
    authenticate : true,
    resolve: {
      file: function($stateParams, fileService) {
        return fileService.get({id: $stateParams.fileId}).$promise;
      }
    }
  })
  
  	//Documentation for Single Project
  .state('project.documentation', {
    url: '/documentation',
	  abstract: true,
    templateUrl: '/app/modules/project/project-documentation/project-documentation.html',
    controller: 'projectDocumentationCtrl',
    authenticate : true,
    resolve: {
      documents: function($stateParams, fileService) {
        return fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise;
      }
    }
  })
  .state('project.documentation.all', {
    url: '',
    templateUrl: '/app/modules/project/project-documentation/all/project-documentation-all.html',
    controller: 'projectDocumentationCtrl',
    authenticate : true
  })
  .state('project.documentation.detail', {
    url: '/detail/:documentId',
    templateUrl: '/app/modules/project/project-documentation/detail/project-documentation-detail.html',
    controller: 'projectDocumentationDetailCtrl',
    authenticate : true,
    resolve: {
      document: function($stateParams, fileService) {
        return fileService.get({id: $stateParams.documentId}).$promise;
      }
    }
  });
  
});