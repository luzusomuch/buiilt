angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('staff', {
    url: '/staff',
    templateUrl: '/app/modules/staff/staff.html',
    controller: 'StaffCtrl'
  });
});