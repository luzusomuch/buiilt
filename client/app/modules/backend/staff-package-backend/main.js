angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('workPackagesBackend', {
    url: '/backend/:id/staff-package',
    templateUrl: '/app/modules/backend/staff-package-backend/view.html',
    controller: 'StaffPackageBackendCtrl',
    authenticate: true,
    backendHasCurrentProject: true,
    isAdmin: true,
    resolve: {
        staffPackages: function(staffPackageService, $stateParams) {
            return staffPackageService.getAll({id: $stateParams.id}).$promise;
        }
    }
  })
});