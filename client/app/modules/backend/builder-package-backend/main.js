angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('builderPackagesBackend', {
    url: '/backend/builder-package',
    templateUrl: '/app/modules/backend/builder-package-backend/view.html',
    controller: 'BuilderPackageBackendCtrl',
    authenticate: true,
    resolve: {
        builderPackages: function(builderPackageService) {
            return builderPackageService.getAll().$promise;
        }
    }
  })
});