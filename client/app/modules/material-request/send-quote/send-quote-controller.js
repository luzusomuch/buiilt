angular.module('buiiltApp')
.controller('SendQuoteMaterialPackageCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, materialRequest, materialRequestService) {
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
  $scope.rate = {};
  $scope.price = {};
  $scope.lineWithRates = [];
  $scope.lineWithPrices = [];

  $scope.addLineWithRate = function() {
    $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
  };
  $scope.addLineWithPrice = function() {
    $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
  };

  $scope.removeLineWithRate = function(index) {
    $scope.lineWithRates.splice(index, 1);
  };
  $scope.removeLineWithPrice = function(index) {
    $scope.lineWithPrices.splice(index, 1);
  };

  $scope.sendQuote = function() {
    if (confirm("Are you sure you want to send this quote")) {
      $scope.lineWithRates.push({
        description: $scope.rate.lineWithRate.rateDescription,
        rate: $scope.rate.lineWithRate.rate,
        quantity: $scope.rate.lineWithRate.rateQuantity,
        total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
      });
      $scope.lineWithPrices.push({
        description: $scope.price.lineWithPrice.description,
        price: $scope.price.lineWithPrice.price,
        quantity: 1,
        total: $scope.price.lineWithPrice.price
      });
      if ($scope.lineWithPrices.length == 0 || $scope.lineWithRates.length == 0) {
        alert('Please review your quote');
        return;
      }
      else {
        materialRequestService.sendQuote({materialRequest: $scope.materialRequest,quoteRequest: $scope.quoteRequest, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
          $scope.success = data;
          $state.go('team.manager');
        });
      }
    }
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

  // $scope.signupAndSendQuotematerial = function () {
  //   $scope.user.idParams = $stateParams.id;
  //   $scope.user.quoteRequest = $scope.quoteRequest;
  //   console.log($scope.user);
  //   registryFormaterialService.createUserFormaterialRequest($scope.user).$promise.then(function(data) {
  //     $scope.user = {
  //       allowNewsletter: true
  //     };
  //     alert('Registry successfully, please confirm your email!')
  //     $state.go('dashboard');
  //   }, function(res) {
  //     $scope.errors = res.data;
  //   });
  // };

});