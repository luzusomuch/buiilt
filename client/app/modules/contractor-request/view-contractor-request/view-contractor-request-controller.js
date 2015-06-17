angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.contractorRequest = contractorRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.message = {};

  $scope.user = {};

  contractorRequestService.getQuoteRequestByContractorPackge({'id':$stateParams.id}).$promise.then(function(data){
    $scope.quoteRequests = data;
  });

  contractorRequestService.getMessageForContractor({'id': $stateParams.id})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
    $scope.newEmail = null;
    $scope.newPhoneNumber = null;
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  $scope.selectQuote = function(value) {
    console.log(value);
    if (confirm("Are you sure you want to select this quote?")) {
      quoteService.get({'id': value}).$promise.then(function(data) { 
          $scope.winner = data;
          $state.reload();
      });
    }
  };

  $scope.sendInvitationInContractor = function() {
    contractorRequestService.sendInvitationInContractor({id: $stateParams.id, toContractor: $scope.emailsPhone})
    .$promise.then(function(data){
      console.log(data);
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

  $scope.sendMessage = function() {
    console.log($scope.message.message);
    contractorRequestService.sendMessage({id: $stateParams.id, message: $scope.message.message})
    .$promise.then(function(data) {
      $scope.messages = data;
    });
  };

});