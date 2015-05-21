angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('dashboard', {
    url: '/',
    templateUrl: '/app/modules/dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
});