angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('board', {
        url: '/:id/board',
        templateUrl: '/app/modules/boards/view.html',
        controller: 'BoardsCtrl',
        hasCurrentProject : true,
        authenticate : true,
        resolve: {
            team: function(authService){
                return authService.getCurrentTeam().$promise;
            },
            builderPackage: function(builderPackageService, $stateParams) {
                return builderPackageService.findDefaultByProject({id: $stateParams.id}).$promise;
            }
        } 
    });
});