angular.module('buiiltApp')
.controller('SendQuoteContractorPackageCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService, registryForContractorService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.contractorRequest = contractorRequest;
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

  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
  };

  $scope.signupAndSendQuoteContractor = function () {
    $scope.user.idParams = $stateParams.id;
    $scope.user.quoteRequest = $scope.quoteRequest;
    console.log($scope.user);
    registryForContractorService.createUserForContractorRequest($scope.user).$promise.then(function(data) {
      $scope.user = {
        allowNewsletter: true
      };
      alert('Registry successfully, please comfirm your email!')
      $state.go('dashboard');
    }, function(res) {
      $scope.errors = res.data;
    });
  };

});