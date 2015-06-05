angular.module('buiiltApp').controller('ViewQuoteRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, quoteRequest, quoteRequetService, quoteService) {
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
    $scope.user.idParams = $stateParams.id;
    quoteService.createUserForHomeBuilderRequest($scope.user).$promise.then(function(data) {
      $scope.user = {
        allowNewsletter: true
      };
      alert('Registry successfully, please comfirm your email!')
      $state.go('dashboard');
    }, function(res) {
      $scope.errors = res.data;
    });
    // authService.createUser($scope.user).then(function (data) {
    //   //show alert
    //   // $state.reload();
    //   $scope.user = {
    //     allowNewsletter: true
    //   };
    // }, function (res) {
    //   $scope.errors = res.data;
    // });
  };

  $scope.selectQuote = function(value) {
    quoteRequetService.selectQuote(value).then(function(quote) {
      $state.go('dashboard');
    });
  };
});