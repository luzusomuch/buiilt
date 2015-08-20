angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materialPackagesBackend', {
    url: '/backend/:id/material-package',
    templateUrl: '/app/modules/backend/material-package-backend/index.html',
    controller: 'MaterialPackageBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    resolve: {
        materialPackages: function(materialPackageService, $stateParams) {
            return materialPackageService.get({id: $stateParams.id}).$promise;
        }
    }
  })
});