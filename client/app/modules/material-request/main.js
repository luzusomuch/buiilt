angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materialRequest', {
    url: '/:id/material-request',
    hasCurrentProject : true,
    authenticate : true,
    template: '<ui-view/>'
  })
  .state('materialRequest.sendQuote', {
    url: '/:packageId',
    templateUrl: '/app/modules/material-request/send-quote/send-quote.html',
    controller: 'SendQuoteMaterialPackageCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.id});
      }
    }
  })
  .state('materialRequest.viewmaterialRequest', {
    url: '/:packageId/view',
    templateUrl: '/app/modules/material-request/view-material-request/view.html',
    controller: 'ViewMaterialRequestCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.id});
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
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.id});
      }
    }
  });
});