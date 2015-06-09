angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materialRequest', {
    url: '/material-request',
    template: '<ui-view/>'
  })
  .state('materialRequest.sendQuote', {
    url: '/:id',
    templateUrl: '/app/modules/material-request/send-quote/send-quote.html',
    controller: 'SendQuoteMaterialPackageCtrl',
    resolve: {
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.id});
      }
    }
  })
  .state('materialRequest.viewmaterialRequest', {
    url: '/:id/view',
    templateUrl: '/app/modules/material-request/view-material-request/view.html',
    controller: 'ViewMaterialRequestCtrl',
    resolve: {
      materialRequest: function($stateParams, materialRequestService){
        return materialRequestService.findOne({'id':$stateParams.id});
      }
    }
  });
});