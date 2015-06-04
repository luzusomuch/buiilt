angular.module('buiiltApp')
.controller('SendQuoteCtrl', function($scope, $state, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteRequetService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.contractorRequest = contractorRequest;
  console.log($scope.contractorRequest);
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};

  $scope.sendQuote = function() {
    contractorRequestService.sendQuote({contractorRequest: $scope.contractorRequest,quoteRequest: $scope.quoteRequest}).$promise.then(function(data){
        $scope.success = data;
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

});