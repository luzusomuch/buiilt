angular.module('buiiltApp')
.controller('SendQuoteContractorPackageCtrl', function($scope, $window, $state, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService, registryForContractorService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.contractorRequest = contractorRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.formData = {
      title: ''
  };

  $scope.user = {};
  $scope.rate = {};
  $scope.price = {};
  $scope.lineWithRates = [];
  $scope.lineWithPrices = [];

  contractorRequestService.getMessageForContractor({'id': $stateParams.id})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.addLineWithRate = function() {
    $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
  };

  $scope.addLineWithPrice = function() {
    $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
  };

  $scope.sendQuote = function() {
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
    contractorRequestService.sendQuote({contractorRequest: $scope.contractorRequest,quoteRequest: $scope.quoteRequest, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
        $scope.success = data;
        alert('You have send quote successfully!');
        // $state.go("team.manager");
    });
  };

  $scope.getSubTotal = function() {
    var subTotal = 0;
    return subTotal;
    // if ($scope.rate && $scope.rate !== null && $scope.rate.length > 0) {
    //   console.log($scope.rate);  
    //   $scope.$watch('rate', function(value) {
    //     if (value) {
    //       console.log(value);
    //     }
    //   }); 
    //   return subTotal;
    // }
    
    // $scope.$watch('rate.lineWithRate.rate', function(value) {
    //   console.log(value);
    // });
    // subTotal = $scope.rate.lineWithRate.rate;
    // return subTotal;
  };

  $scope.sendMessage = function() {
    contractorRequestService.sendMessage({id: $stateParams.id, message: $scope.message})
    .$promise.then(function(data) {
      $scope.messages = data;
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
      alert('Registry successfully, please confirm your email!')
      $window.location.href = $scope.quoteRequest.project._id + '/dashboard';
    }, function(res) {
      $scope.errors = res.data;
    });
  };

});