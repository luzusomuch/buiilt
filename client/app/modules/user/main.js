angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('user', {
    url: '/user',
    templateUrl: '/app/modules/user/user.html',
    controller: 'UserCtrl',
    authenticate: true,
    adminAccess: true
  })
  .state('user.form', {
    url: '/:id',
    templateUrl: '/app/modules/user/edit-user/form.html',
    controller: 'UserFormCtrl'
  })
  ;
});