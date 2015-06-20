angular.module('buiiltApp')
.controller('MaterialPackageInProcessCtrl', function($scope, $state, $stateParams, $cookieStore, materialRequest, fileService, authService, userService,materialRequestService) {
  /**
   * quote data
   */
  $scope.materialRequest = materialRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  materialRequestService.getMessageForSupplier({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.showDocument = function() {
    fileService.getFileByStateParam({'id': $stateParams.packageId})
    .$promise.then(function(data) {
      $scope.files = data;
    });
  };

  $scope.sendMessage = function() {
    materialRequestService.sendMessage({id: $stateParams.packageId, message: $scope.message})
    .$promise.then(function(data) {
      $scope.messages = data;
    });
  };
});