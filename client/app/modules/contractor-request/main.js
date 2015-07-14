angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractorRequest', {
    url: '/:id/contractor-requests',
    hasCurrentProject : true,
    authenticate : true,
    template: '<ui-view/>'
  })
  .state('contractorRequest.sendQuote', {
    url: '/:packageId',
    templateUrl: '/app/modules/contractor-request/send-quote/send-quote.html',
    controller: 'SendQuoteContractorPackageCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      contractorRequest: function($stateParams, contractorRequestService){
        return contractorRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  })
  .state('contractorRequest.viewContractorRequest', {
    url: '/:packageId/view',
    templateUrl: '/app/modules/contractor-request/view-contractor-request/view.html',
    controller: 'ViewContractorRequestCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      contractorRequest: function($stateParams, contractorRequestService){
        return contractorRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  })
  .state('contractorRequest.contractorPackageInProcess', {
    url: '/:packageId/processing',
    templateUrl: '/app/modules/contractor-request/contractor-package-in-process/view.html',
    controller: 'ContractorPackageInProcessCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      currentTeam : [
        'authService',
        function(authService) {
          return authService.getCurrentTeam().$promise;
        }
      ],
      contractorRequest: function($stateParams, contractorRequestService){
        return contractorRequestService.findOne({'id':$stateParams.packageId}).$promise;
      }
    }
  });
});
