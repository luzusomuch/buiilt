angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
	
	//Parents State for All Projects
    .state('projects', {
    	url: '/projects',
    	templateUrl: '/app/modules/projects/projects.html',
    	controller: 'projectsCtrl',
    	authenticate : true
    })
  
  //State for all projects
    .state('projects.all', {
    	url: '/all',
    	templateUrl: '/app/modules/projects/partials/projects-all.html',
    	controller: 'projectsCtrl',
    	authenticate : true
    })
  
  //State to create a new project
      .state('projects.create', {
    	url: '/new',
    	templateUrl: '/app/modules/projects/partials/projects-create.html',
    	controller: 'projectsCtrl',
    	authenticate : true
      })
  
    .state('projects.invitations', {
	   url: '/invitations',
	   templateUrl: '/app/modules/projects/partials/projects-invitations.html',
	   controller: 'projectsCtrl',
	   authenticate : true
    });
});