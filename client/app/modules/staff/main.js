angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('staff', {
    url: '/:id/staff',
    templateUrl: '/app/modules/staff/staff.html',
    controller: 'StaffCtrl',
    hasCurrentProject : true,
    resolve: {
      staffPackage : [
        '$rootScope','staffPackageService',
        function($rootScope,staffPackageService) {
          return staffPackageService.get({id : $rootScope.currentProject._id})
        }
      ]
    }
  });
});