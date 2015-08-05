angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('workPackagesBackend', {
    url: '/backend/staff-package',
    templateUrl: '/app/modules/backend/staff-package-backend/view.html',
    controller: 'StaffPackageBackendCtrl',
    authenticate: true,
    resolve: {
        staffPackages: function(staffPackageService) {
            return staffPackageService.getAll().$promise;
        }
    }
  })
});