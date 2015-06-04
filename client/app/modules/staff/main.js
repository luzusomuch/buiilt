angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('staff', {
    url: '/:id/staff',
    templateUrl: '/app/modules/staff/staff.html',
    controller: 'StaffCtrl',
    hasCurrentProject : true
  });
});