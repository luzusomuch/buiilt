angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('quoteRequest', {
    url: '/quote-requests',
    template: '<ui-view/>'
  })
  .state('quoteRequest.view', {
    url: '/:id',
    templateUrl: '/app/modules/quote-request/view-request/view-request.html',
    controller: 'ViewQuoteRequestCtrl',
    resolve: {
      quoteRequest: function($stateParams, quoteRequetService){
        return quoteRequetService.findOne($stateParams.id);
      }
    }
  });
});