angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('variationRequest', {
    url: '/:id/variation-requests',
    hasCurrentProject : true,
    authenticate : true,
    template: '<ui-view/>'
  })
  .state('variationRequest.sendQuote', {
    url: '/:variationId',
    templateUrl: '/app/modules/variation-request/send-quote/send-quote.html',
    controller: 'SendQuoteVariationCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      variationRequest: function($stateParams, variationRequestService){
        return variationRequestService.findOne({'id':$stateParams.variationId}).$promise;
      }
    }
  })
  .state('variationRequest.viewRequest', {
    url: '/:variationId/view',
    templateUrl: '/app/modules/variation-request/view-variation-request/view.html',
    controller: 'ViewVariationRequestCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      variationRequest: function($stateParams, variationRequestService){
        return variationRequestService.findOne({'id':$stateParams.variationId}).$promise;
      }
    }
  })
  .state('variationRequest.inProcess', {
    url: '/:variationId/processing',
    templateUrl: '/app/modules/variation-request/variation-in-process/view.html',
    controller: 'VariationInProcessCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      variationRequest: function($stateParams, variationRequestService){
        return variationRequestService.findOne({'id':$stateParams.variationId}).$promise;
      }
    }
  });
});