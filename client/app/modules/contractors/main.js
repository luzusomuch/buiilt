angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractors', {
    url: '/contractors',
    templateUrl: '/app/modules/contractors/contractors.html',
    controller: 'ContractorsCtrl',
    resolve: {
    contractors: function (contractorService) {
        return contractorService.get();
      }
    }
  }
  )
  .state('contractors.form', {
    url: '/add',
    templateUrl: '/app/modules/contractors/form.html',
    controller: 'FormContractorsCtrl',
  }
  )
  ;
});