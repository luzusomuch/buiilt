angular.module('buiiltApp').controller('ViewQuoteRequestCtrl', function($scope, $state, $cookieStore, authService, userService, quoteRequest, quoteRequetService) {
  /**
   * quote data
   */
  $scope.quoteRequest = quoteRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};
  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
  };

  $scope.signup = function () {
    authService.createUser($scope.user).then(function (data) {
      //show alert
      // $state.reload();
      $scope.user = {
        allowNewsletter: true
      };
    }, function (res) {
      $scope.errors = res.data;
    });
  };

  $scope.selectQuote = function(value) {
    quoteRequetService.selectQuote(value).then(function(quote) {
      $state.go('dashboard');
    });
  };
});