angular.module('buiiltApp')
.controller('ViewMaterialRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, materialRequest, materialRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.materialRequest = materialRequest;
  console.log($scope.materialRequest);
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};

  materialRequestService.getQuoteRequestBymaterialPackge({'id':$stateParams.id}).$promise.then(function(data){
    $scope.quoteRequests = data;
  })

  $scope.selectQuote = function(value) {
    quoteService.get({'id': value}).$promise.then(function(data) { 
        $scope.winner = data;
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

});