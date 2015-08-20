angular.module('buiiltApp')
  .controller('SignoutBackendCtrl', function($scope,$state, $window, authService) {
  authService.logout();
  $state.go('signinBackend');
});