angular.module('buiiltApp').controller('ViewQuoteRequestCtrl', function($scope, $state, $cookieStore, userService, quoteRequest, quoteRequetService) {
  /**
   * quote data
   */
  $scope.quoteRequest = quoteRequest;

  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.selectQuote = function(value) {
    quoteRequetService.selectQuote(value).then(function(quote) {
      $state.go('dashboard');
    });
  };
});