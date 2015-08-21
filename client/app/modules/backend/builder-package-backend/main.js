angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('builderPackagesBackend', {
    url: '/backend/:id/builder-package',
    templateUrl: '/app/modules/backend/builder-package-backend/view.html',
    controller: 'BuilderPackageBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        builderPackage: function(builderPackageService, $stateParams) {
            return builderPackageService.findDefaultByProject({id: $stateParams.id}).$promise;
        }
    }
  })
});