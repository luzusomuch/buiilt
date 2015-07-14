angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($scope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.contractorRequest = contractorRequest;
  $scope.currentTeam = currentTeam;
  if ($scope.currentTeam.type != 'builder' && contractorRequest.owner._id != currentTeam._id) {
    $state.go('team.manager');
  }
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

  fileService.getFileByStateParam({id: $stateParams.packageId})
  .$promise.then(function(data){
    $scope.files = data;
  });

  $scope.downloadFile = function(value) {
    fileService.downloadFile({id: value._id})
    .$promise.then(function(data){
      $window.open(data.url);
    });
  };

  contractorRequestService.getMessageForBuilder({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.addUser = function() {
    if ($scope.user.newEmail) {
      $scope.emailsPhone.push({email: $scope.user.newEmail, phoneNumber: $scope.user.newPhoneNumber});
      $scope.user.newEmail = null;
      $scope.user.newPhoneNumber = null;
    }
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  //Todo add confirm when select quote
  $scope.selectQuote = function(value) {
    quoteService.get({'id': value}).$promise.then(function(data) { 
        $scope.winner = data;
        $state.go('contractorRequest.contractorPackageInProcess', {id: data.project, packageId: data._id});
    });
  };

  $scope.declineQuote = function(value) {
    contractorRequestService.declineQuote({id: contractorRequest._id, belongTo: value}).$promise.then(function(data){
      $scope.contractorRequest = data;
    });
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
    }
    else if (value != 'undefined' || value){
      contractorRequestService.sendMessage({id: $stateParams.packageId, to: value, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.messages = data;
        $scope.message.message = null;
      });
    }
  };

  //Cancel package
  //Todo add confirm when cancel package
  $scope.cancelPackage = function() {
    contractorRequestService.cancelPackage({id: $stateParams.packageId})
    .$promise.then(function(data) {
      $state.go('contractors',{id: $stateParams.id});
    });
  };
});