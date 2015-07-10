angular.module('buiiltApp')
  .controller('SignoutCtrl', function($scope, $window, authService) {
  authService.logout();

  $window.location.href = '/signin';
});