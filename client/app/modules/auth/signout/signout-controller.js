angular.module('buiiltApp').controller('SignoutCtrl', function($scope, $state, authService) {
  authService.logout();

  $state.go('home');
});