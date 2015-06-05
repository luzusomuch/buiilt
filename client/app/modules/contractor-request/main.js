angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractorRequest', {
    url: '/contractor-requests',
    template: '<ui-view/>'
  })
  .state('contractorRequest.sendQuote', {
    url: '/:id',
    templateUrl: '/app/modules/contractor-request/send-quote/send-quote.html',
    controller: 'SendQuoteContractorPackageCtrl',
    resolve: {
      contractorRequest: function($stateParams, contractorRequestService){
        return contractorRequestService.findOne({'id':$stateParams.id});
      }
    }
  })
  .state('contractorRequest.viewContractorRequest', {
    url: '/:id/view',
    templateUrl: '/app/modules/contractor-request/view-contractor-request/view.html',
    controller: 'ViewContractorRequestCtrl',
    resolve: {
      contractorRequest: function($stateParams, contractorRequestService){
        return contractorRequestService.findOne({'id':$stateParams.id});
      }
    }
  });
});