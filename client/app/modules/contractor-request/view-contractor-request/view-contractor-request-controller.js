angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService) {
  /**
   * quote data
   */
  $scope.contractorRequest = contractorRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};

  contractorRequestService.getQuoteRequestByContractorPackge({'id':$stateParams.id}).$promise.then(function(data){
    $scope.quoteRequests = data;
  })

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

});