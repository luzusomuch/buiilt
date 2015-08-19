angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('client', {
    url: '/:id/client',
    hasCurrentProject: true,
    template: '<ui-view/>',
    authenticate:true
  })
  .state('client.list', {
    url: '/list',
    templateUrl: '/app/modules/client/client.html',
    controller: 'ClientCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      builderPackage: function(builderPackageService, $stateParams) {
            return builderPackageService.findDefaultByProject({id : $stateParams.id}).$promise;
        },
      team: function(authService){
        return authService.getCurrentTeam().$promise;
      },
    }
  })
  .state('client.view', {
    url: '/view',
    templateUrl: '/app/modules/client/view.html',
    controller: 'ClientViewCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      builderPackage: function(builderPackageService, $stateParams) {
            return builderPackageService.findDefaultByProject({id : $stateParams.id}).$promise;
        },
      team: function(authService){
        return authService.getCurrentTeam().$promise;
      },
    }
  });
});