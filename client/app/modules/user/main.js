angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('user', {
    url: '/user',
    templateUrl: '/app/modules/user/user.html',
    controller: 'UserCtrl'
  });
});