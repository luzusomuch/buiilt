angular.module('buiiltApp')
.controller('ViewMaterialRequestCtrl', function($scope, $state, $stateParams, $cookieStore, authService, userService, materialRequest, materialRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.materialRequest = materialRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.user = {};

  materialRequestService.getQuoteRequestByMaterialPackge({'id':$stateParams.id}).$promise.then(function(data){
    $scope.quoteRequests = data;
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
    if (confirm("Are you sure you want to select this quote?")) {
      quoteService.getForMaterial({'id': value}).$promise.then(function(data) { 
          $scope.winner = data;
          $state.reload();
      });
    }
  };

  $scope.sendInvitationInMaterial = function() {
    materialRequestService.sendInvitationInMaterial({id: $stateParams.id, toSupplier: $scope.emailsPhone})
    .$promise.then(function(data){
      console.log(data);
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

});