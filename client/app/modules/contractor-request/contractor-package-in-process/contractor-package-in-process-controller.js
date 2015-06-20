angular.module('buiiltApp')
.controller('ContractorPackageInProcessCtrl', function($scope, $state, $stateParams, $cookieStore, fileService, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.contractorRequest = contractorRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  contractorRequestService.getMessageForContractor({'id': $stateParams.packageId})
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
    contractorRequestService.sendMessage({id: $stateParams.packageId, message: $scope.message})
    .$promise.then(function(data) {
      $scope.messages = data;
    });
  };

});