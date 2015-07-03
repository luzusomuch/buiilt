angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($scope, $window, $state, $stateParams,currentTeam, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.contractorRequest = contractorRequest;
  $scope.currentTeam = currentTeam;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }
  $scope.message = {};
  $scope.addendum = {};
  $scope.addendumsScope = [];
  $scope.user = {};

  contractorRequestService.getQuoteRequestByContractorPackge({'id':$stateParams.packageId}).$promise.then(function(data){
    $scope.quoteRequests = data;
    _.each(data.to, function(toContractor){
      $scope.toContractor = toContractor;
    });
  });

  contractorRequestService.getMessageForBuilder({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.user.newEmail, phoneNumber: $scope.user.newPhoneNumber});
    $scope.user.newEmail = null;
    $scope.user.newPhoneNumber = null;
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  $scope.selectQuote = function(value) {
    if (confirm("Are you sure you want to select this quote?")) {
      quoteService.get({'id': value}).$promise.then(function(data) { 
          $scope.winner = data;
          $state.reload();
      });
    }
  };

  $scope.sendInvitationInContractor = function() {
    contractorRequestService.sendInvitationInContractor({id: $stateParams.packageId, toContractor: $scope.emailsPhone})
    .$promise.then(function(data){
      $scope.contractorRequest = data;
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

  $scope.sendMessage = function(value) {
    if (value == 'undefined' || !value) {
      alert('This user not registry');
    }
    else if (value != 'undefined' || value){
      contractorRequestService.sendMessage({id: $stateParams.packageId, to: value, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.messages = data;
        $scope.message.message = null;
      });
    }
  };

  //Send addendum
  // $scope.addAddendum = function() {
  //   $scope.addendumsScope.push({scopeDescription: $scope.addendum.scopeDescription, quantity: $scope.addendum.quantity});
  //   $scope.addendum.scopeDescription = null;
  //   $scope.addendum.quantity = null;
  // };
  // $scope.removeAddendum = function(index) {
  //   $scope.addendumsScope.splice(index, 1);
  // };
  // $scope.sendAddendum = function() {
  //   contractorRequestService.sendAddendum({id: $stateParams.packageId, description: $scope.addendum, addendumScope: $scope.addendumsScope})
  //   .$promise.then(function(data) {
  //     // $scope.messages = data;
  //   });
  // };

  //Cancel package
  $scope.cancelPackage = function() {
    if (confirm('Cancel this package?!')) {
      contractorRequestService.cancelPackage({id: $stateParams.packageId})
      .$promise.then(function(data) {
        // console.log($state.get());
        $window.location.href = data.project + '/contractors';
        // $state.go('^.contractors, {id: '+ data.project +'}');
      });
    }
  };
});