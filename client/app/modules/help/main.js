angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
	
    .state('help', {
    	url: '/help',
    	abstract: true,
    	templateUrl: '/app/modules/help/help.html',
        resolve: {
            currentUser: function(authService) {
                return authService.getCurrentUser().$promise;
            }
        }
    })
  
    .state('help.start', {
     	url: '/getting-started',
     	templateUrl: '/app/modules/help/partials/getting-started.html',
     	controller: 'helpCtrl',
     	authenticate : true
    })

    .state('help.teams', {
    	url: '/teams',
    	templateUrl: '/app/modules/help/partials/teams.html',
    	controller: 'helpCtrl',
    	authenticate : true
    })

    .state('help.projects', {
    	url: '/projects',
    	templateUrl: '/app/modules/help/partials/projects.html',
    	controller: 'helpCtrl',
    	authenticate : true
    })

    .state('help.calendar', {
    	url: '/calendar',
    	templateUrl: '/app/modules/help/partials/calendar.html',
    	controller: 'helpCtrl',
    	authenticate : true
    })

    .state('help.messages', {
    	url: '/messages',
    	templateUrl: '/app/modules/help/partials/messages.html',
    	controller: 'helpCtrl',
    	authenticate : true
    })

    .state('help.documentation', {
    	url: '/documentation',
    	templateUrl: '/app/modules/help/partials/documentation.html',
    	controller: 'helpCtrl',
    	authenticate : true
    });
});