angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('dashboard', {
    url: '/dashboard',
    templateUrl: '/app/modules/dashboard/dashboard.html',
    controller: 'DashboardCtrl',
    hasCurrentProject : true
  });
});