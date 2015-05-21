angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('home', {
    url: '/home',
    templateUrl: '/app/modules/home/home.html',
    controller: 'HomeCtrl'
  });
});