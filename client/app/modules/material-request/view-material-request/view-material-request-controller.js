angular.module('buiiltApp')
.controller('ViewMaterialRequestCtrl', function($scope, $state, $stateParams,currentTeam, $cookieStore, authService, userService, materialRequest, materialRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.materialRequest = materialRequest;
  $scope.currentTeam = currentTeam;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};
  $scope.toSupplier = {};
  $scope.message = {};

  materialRequestService.getQuoteRequestByMaterialPackge({'id':$stateParams.packageId}).$promise.then(function(data){
    $scope.quoteRequests = data;
  });

  materialRequestService.getMessageForBuilder({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.toSupplier.newEmail, phoneNumber: $scope.toSupplier.newPhoneNumber});
    $scope.toSupplier.newEmail = null;
    $scope.toSupplier.newPhoneNumber = null;
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  $scope.selectQuote = function(value) {
    if (confirm("Are you sure you want to select this quote?")) {
      quoteService.getForMaterial({'id': value}).$promise.then(function(data) { 
          $scope.winner = data;
          $state.reload();
      });
    }
  };

  $scope.sendInvitation = function() {
    materialRequestService.sendInvitationInMaterial({id: $stateParams.packageId, toSupplier: $scope.emailsPhone})
    .$promise.then(function(data){
      $scope.materialRequest = data;
    });
  };

  $scope.sendMessage = function(value) {
    if (value == 'undefined' || !value) {
      alert('This user not registry');
    }
    else if(value != 'undefined' || value) {
      materialRequestService.sendMessage({id: $stateParams.packageId, to: value, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.messages = data;
      });  
    }
  };

  // $scope.closeSuccess = function() {
  //   $scope.success = false;
  // };

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
  //   materialRequestService.sendAddendum({id: $stateParams.packageId, description: $scope.addendum, addendumScope: $scope.addendumsScope})
  //   .$promise.then(function(data) {
  //     // $scope.messages = data;
  //   });
  // };

});