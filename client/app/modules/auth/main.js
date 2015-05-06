angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('signup', {
    url: '/signup',
    templateUrl: '/app/modules/auth/signup/signup.html',
    controller: 'SignupCtrl'
  })
  .state('signin', {
    url: '/signin',
    templateUrl: '/app/modules/auth/signin/signin.html'
  })
  .state('signout', {
    url: '/signout',
    controller: 'SignoutCtrl'
  });
});