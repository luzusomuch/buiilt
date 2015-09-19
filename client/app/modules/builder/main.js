angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('builderRequest', {
        url: '/:id/builder-request',
        hasCurrentProject : true,
        authenticate : true,
        template: '<ui-view/>',
        resolve: {
            currentTeam: function(authService){
                return authService.getCurrentTeam().$promise;
            },
            builderRequest: function($stateParams, builderPackageService){
                return builderPackageService.findDefaultByProject({'id':$stateParams.id}).$promise;
            }
        }
    })
    .state('builderRequest.sendQuote', {
        url: '/sendQuote',
        templateUrl: '/app/modules/builder/send-quote/view.html',
        controller: 'SendQuoteCtrl',
        hasCurrentProject : true,
        authenticate : true
    })
    .state('builderRequest.viewRequest', {
        url: '/view',
        templateUrl: '/app/modules/builder/view-request/view.html',
        controller: 'ViewRequestCtrl',
        hasCurrentProject : true,
        authenticate : true
    })
    .state('builderRequest.inProgress', {
        url: '/processing',
        templateUrl: '/app/modules/builder/in-process/view.html',
        controller: 'InProcessCtrl',
        hasCurrentProject : true,
        authenticate : true
    })
});