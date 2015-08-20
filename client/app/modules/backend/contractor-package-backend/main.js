angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractorPackagesBackend', {
    url: '/backend/:id/contractor-package',
    templateUrl: '/app/modules/backend/contractor-package-backend/index.html',
    controller: 'ContractorPackageBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        contractorPackages: function(contractorService, $stateParams) {
            return contractorService.get({id: $stateParams.id}).$promise;
        }
    }
  })
});