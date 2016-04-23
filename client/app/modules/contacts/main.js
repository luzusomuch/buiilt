angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
	
    .state('contacts', {
    	url: '/contacts',
    	abstract: true,
    	templateUrl: '/app/modules/contacts/contacts.html',
        resolve: {
            contactBooks: function(contactBookService) {
                return contactBookService.me().$promise;
            }
        }
    })
 
    .state("contacts.all", {
        url: "/all",
        templateUrl: "/app/modules/contacts/partials/contacts-all.html",
        controller: "contactsCtrl",
        authenticate: true
    });
});