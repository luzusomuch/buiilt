angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materialPackagesBackend', {
    url: '/backend/material-package',
    templateUrl: '/app/modules/material-package-backend/index.html',
    controller: 'MaterialPackageBackendCtrl',
    authenticate: true,
    resolve: {
        materialPackages: function(materialPackageService) {
            return materialPackageService.getAll().$promise;
        }
    }
  })
});