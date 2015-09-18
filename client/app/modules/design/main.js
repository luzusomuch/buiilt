angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('design', {
        url: '/:id/design',
        template: '<ui-view></ui-view>',
        hasCurrentProject : true,
        authenticate : true,
        resolve : {
            currentTeam : [
                'authService',
                function(authService) {
                    return authService.getCurrentTeam().$promise;
                }
            ],
            currentUser : [
                'authService',
                function(authService) {
                    return authService.getCurrentUser().$promise;
                }
            ]
        }
    })
    .state('design.index', {
        url: '/',
        templateUrl: '/app/modules/design/index/index.html',
        controller: 'DesignCtrl',
        hasCurrentProject : true,
        authenticate : true,
        resolve : {
            designs : [
                'designService','$stateParams',
                function(designService,$stateParams) {
                    return designService.getAll({id : $stateParams.id}).$promise
                }
            ]
        }
    })
    .state('design.detail', {
        url: '/:packageId/',
        templateUrl: '/app/modules/design/detail/detal.html',
        controller: 'DesignDetailCtrl',
        hasCurrentProject : true,
        authenticate : true,
        resolve : {
            design : [
                'designService','$stateParams',
                function(designService,$stateParams) {
                    return designService.get({id : $stateParams.packageId}).$promise
                }
            ]
        }
    })
});