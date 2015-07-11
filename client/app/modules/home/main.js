angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: '/app/modules/home/home.html',
      controller: 'HomeCtrl',
      authenticate : true

    });
});