angular.module('buiiltApp')
.controller('MaterialPackageInProcessCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, contractorRequestService) {
  /**
   * quote data
   */
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }
});