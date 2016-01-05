angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
	
	//Parents State for Singular Project
  .state('project', {
  	url: '/project/:id',
  	templateUrl: '/app/modules/project/project.html',
  	controller: 'projectCtrl',
  	authenticate : true
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
    url: '',
    templateUrl: '/app/modules/project/project-team/all/project-team-all.html',
    controller: 'projectTeamCtrl',
    authenticate : true
  })
  
	//Tenders for Single Project
  .state('project.tenders', {
    url: '/tenders',
	  abstract: true,
    templateUrl: '/app/modules/project/project-tenders/project-tenders.html',
    controller: 'projectTendersCtrl',
    authenticate : true
  })
  .state('project.tenders.all', {
    url: '',
    templateUrl: '/app/modules/project/project-tenders/all/project-tenders-all.html',
    controller: 'projectTendersCtrl',
    authenticate : true
  })
  .state('project.tenders.detail', {
    url: '/detail/:tenderId',
    templateUrl: '/app/modules/project/project-tenders/detail/project-tenders-detail.html',
    controller: 'projectTendersDetailCtrl',
    authenticate : true
  })
  
  	//Messages for Single Project
  .state('project.messages', {
    url: '/messages',
	abstract: true,
    templateUrl: '/app/modules/project/project-messages/project-messages.html',
    controller: 'projectMessagesCtrl',
    authenticate : true
  })
  .state('project.messages.all', {
    url: '',
    templateUrl: '/app/modules/project/project-messages/all/project-messages-all.html',
    controller: 'projectMessagesCtrl',
    authenticate : true
  })
  .state('project.messages.detail', {
    url: '/detail',
    templateUrl: '/app/modules/project/project-messages/detail/project-messages-detail.html',
    controller: 'projectMessagesCtrl',
    authenticate : true
  })
  
  	//Tasks for Single Project
  .state('project.tasks', {
    url: '/tasks',
	abstract: true,
    templateUrl: '/app/modules/project/project-tasks/project-tasks.html',
    controller: 'projectTasksCtrl',
    authenticate : true
  })
  .state('project.tasks.all', {
    url: '',
    templateUrl: '/app/modules/project/project-tasks/all/project-tasks-all.html',
    controller: 'projectTasksCtrl',
    authenticate : true
  })
  .state('project.tasks.detail', {
    url: '/detail',
    templateUrl: '/app/modules/project/project-tasks/detail/project-tasks-detail.html',
    controller: 'projectTasksCtrl',
    authenticate : true
  })
  
  	//Files for Single Project
  .state('project.files', {
    url: '/files',
	abstract: true,
    templateUrl: '/app/modules/project/project-files/project-files.html',
    controller: 'projectFilesCtrl',
    authenticate : true
  })
  .state('project.files.all', {
    url: '',
    templateUrl: '/app/modules/project/project-files/all/project-files-all.html',
    controller: 'projectFilesCtrl',
    authenticate : true
  })
  .state('project.files.detail', {
    url: '/detail',
    templateUrl: '/app/modules/project/project-files/detail/project-files-detail.html',
    controller: 'projectFilesCtrl',
    authenticate : true
  })
  
  	//Documentation for Single Project
  .state('project.documentation', {
    url: '/documentation',
	abstract: true,
    templateUrl: '/app/modules/project/project-documentation/project-documentation.html',
    controller: 'projectDocumentationCtrl',
    authenticate : true
  })
  .state('project.documentation.all', {
    url: '',
    templateUrl: '/app/modules/project/project-documentation/all/project-documentation-all.html',
    controller: 'projectDocumentationCtrl',
    authenticate : true
  })
  .state('project.documentation.detail', {
    url: '/detail',
    templateUrl: '/app/modules/project/project-documentation/detail/project-documentation-detail.html',
    controller: 'projectDocumentationCtrl',
    authenticate : true
  })
  
  //Old Code
  .state('projects.view', {
    url: '/:id',
    templateUrl: '/app/modules/project/view-project/view.html',
    controller: 'ViewProjectCtrl',
    authenticate : true,
    resolve: {
      project: function($stateParams, projectService) {
        return projectService.get({id: $stateParams.id}).$promise;
      },
      builderPackage: function(builderPackageService, $stateParams) {
        return builderPackageService.findDefaultByProject({id: $stateParams.id}).$promise;
      }
    },
    hasCurrentProject : true
  });
  
});