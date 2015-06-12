angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteService) {
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

  $scope.selectQuote = function(value) {
    console.log(value);
    if (confirm("Are you sure you want to select this quote?")) {
      quoteService.get({'id': value}).$promise.then(function(data) { 
          $scope.winner = data;
          $state.reload();
      });
    }
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

});