angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('userBackend', {
    url: '/backend/user',
    templateUrl: '/app/modules/user-backend/user.html',
    controller: 'UserBackendCtrl',
    authenticate: true,
    resolve: {
        users: function(userService) {
            return userService.getAll();
        }
    }
  })
});