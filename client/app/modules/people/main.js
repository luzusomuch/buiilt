angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('people', {
        url: '/:id/people',
        templateUrl: '/app/modules/people/view.html',
        controller: 'PeopleCtrl',
        hasCurrentProject : true,
        authenticate : true,
        resolve: {
            team: function(authService){
                return authService.getCurrentTeam().$promise;
            },
            currentUser: function(authService){
                return authService.getCurrentUser().$promise;
            },
            builderPackage: function(builderPackageService, $stateParams) {
                return builderPackageService.findDefaultByProject({id: $stateParams.id}).$promise;
            }
        } 
    });
});