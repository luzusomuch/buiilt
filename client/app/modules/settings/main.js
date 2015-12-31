angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
	
  .state('settings', {
	url: '/settings',
	abstract: true,
	templateUrl: '/app/modules/settings/settings.html',
	controller: 'settingsCtrl',
	authenticate : true
  })
  
  .state('settings.user', {
	url: '/user',
	templateUrl: '/app/modules/settings/partials/settings-user.html',
	controller: 'settingsCtrl',
	authenticate : true
  })
  
  
  .state('settings.company', {
	url: '/company',
	templateUrl: '/app/modules/settings/partials/settings-company.html',
	controller: 'settingsCtrl',
	authenticate : true
  })
  
  .state('settings.staff', {
	url: '/staff',
	templateUrl: '/app/modules/settings/partials/settings-staff.html',
	controller: 'settingsCtrl',
	authenticate : true
  })
  
  .state('settings.billing', {
	url: '/billing',
	templateUrl: '/app/modules/settings/partials/settings-billing.html',
	controller: 'settingsCtrl',
	authenticate : true
  });
  
});