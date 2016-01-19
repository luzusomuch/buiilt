angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
	
	//Parents State for All Projects
    .state('projects', {
    	url: '/projects',
		abstract: true,
    	templateUrl: '/app/modules/projects/projects.html',
    	controller: 'projectsCtrl',
    	authenticate : true,
        resolve: {
            teamInvitations: function(authService){
                return authService.getCurrentInvitation().$promise;
            },
            projectsInvitation: function(inviteTokenService) {
                return inviteTokenService.getProjectsInvitation().$promise;
            }
        }
    })
  
  //State for Open projects
    .state('projects.open', {
    	url: '/open',
    	templateUrl: '/app/modules/projects/projects-open/projects-open.html',
    	controller: 'projectsCtrl',
    	authenticate : true
    })

  //States for Project Archived
    .state('projects.archived', {
	   url: '/archived',
	   templateUrl: '/app/modules/projects/projects-archived/projects-archived.html',
	   controller: 'projectsCtrl',
	   authenticate : true
    })
	
  //States for Project Invitations
    .state('projects.invitations', {
	    url: '/invitations',
	    templateUrl: '/app/modules/projects/projects-invitations/projects-invitations.html',
	    controller: 'projectsCtrl',
	    authenticate : true
    })
});