angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractorPackagesBackend', {
    url: '/backend/contractor-package',
    templateUrl: '/app/modules/contractor-package-backend/index.html',
    controller: 'ContractorPackageBackendCtrl',
    authenticate: true,
    resolve: {
        contractorPackages: function(contractorService) {
            return contractorService.getAll();
        }
    }
  })
});