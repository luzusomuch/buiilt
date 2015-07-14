angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materialRequest', {
    url: '/:id/material-request',
    hasCurrentProject : true,
    authenticate : true,
    template: '<ui-view/>',
    authenticate : true
  })
  .state('materialRequest.sendQuote', {
    url: '/:packageId',
    templateUrl: '/app/modules/material-request/send-quote/send-quote.html',
    controller: 'SendQuoteMaterialPackageCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  })
  .state('materialRequest.viewMaterialRequest', {
    url: '/:packageId/view',
    templateUrl: '/app/modules/material-request/view-material-request/view.html',
    controller: 'ViewMaterialRequestCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  })
  .state('materialRequest.materialPackageInProcess', {
    url: '/:packageId/processing',
    templateUrl: '/app/modules/material-request/material-package-in-process/view.html',
    controller: 'MaterialPackageInProcessCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  });
});