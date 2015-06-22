angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('signup', {
    url: '/signup?teamInviteToken',
    templateUrl: '/app/modules/auth/signup/signup.html',
    controller: 'SignupCtrl'
  })
  .state('signupWithInvite', {
    url: '/signup-invite?packageInviteToken',
    templateUrl: '/app/modules/auth/signup-with-invite/signup.html',
    controller: 'SignupWithInviteCtrl'
  })
  .state('signin', {
    url: '/signin',
    templateUrl: '/app/modules/auth/signin/signin.html',
    controller: 'SigninCtrl'
  })
  .state('signout', {
    url: '/signout',
    controller: 'SignoutCtrl'
  });
});