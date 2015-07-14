angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('staff', {
      url: '/:id/staff',
      template: '<ui-view></ui-view>',
      hasCurrentProject : true,
      authenticate : true,
      canAccess : ['builder'],
      resolve : {
        currentTeam : [
          'authService',
          function(authService) {
            return authService.getCurrentTeam().$promise;
          }
        ],
        currentUser : [
          'authService',
          function(authService) {
            return authService.getCurrentUser().$promise;
          }
        ]
      }
    })
    .state('staff.index', {
      url: '/',
      templateUrl: '/app/modules/staff/views/index.html',
      controller: 'StaffCtrl',
      hasCurrentProject : true,
      authenticate : true,
      canAccess : ['builder'],
      resolve : {
        staffPackages : [
          'staffPackageService','$stateParams',
          function(staffPackageService,$stateParams) {
            return staffPackageService.getAll({id : $stateParams.id}).$promise
          }
        ]
      }
    })
    .state('staff.view', {
      url: '/:packageId/',
      templateUrl: '/app/modules/staff/views/view.html',
      controller: 'StaffViewCtrl',
      hasCurrentProject : true,
      authenticate : true,
      canAccess : ['builder'],
      resolve : {
        staffPackage : [
          'staffPackageService','$stateParams',
          function(staffPackageService,$stateParams) {
            return staffPackageService.get({id : $stateParams.packageId}).$promise
          }
        ]

      }
    })
  });