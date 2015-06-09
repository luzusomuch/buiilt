angular.module('buiiltApp')
.controller('SendQuoteMaterialPackageCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, materialRequest, materialRequestService, registryFormaterialService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.materialRequest = materialRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};

  $scope.sendQuote = function() {
    materialRequestService.sendQuote({materialRequest: $scope.materialRequest,quoteRequest: $scope.quoteRequest}).$promise.then(function(data){
        $scope.success = data;
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
  };

  $scope.signupAndSendQuotematerial = function () {
    $scope.user.idParams = $stateParams.id;
    $scope.user.quoteRequest = $scope.quoteRequest;
    console.log($scope.user);
    registryFormaterialService.createUserFormaterialRequest($scope.user).$promise.then(function(data) {
      $scope.user = {
        allowNewsletter: true
      };
      alert('Registry successfully, please confirm your email!')
      $state.go('dashboard');
    }, function(res) {
      $scope.errors = res.data;
    });
  };

});