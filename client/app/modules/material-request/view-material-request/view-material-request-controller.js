angular.module('buiiltApp')
.controller('ViewMaterialRequestCtrl', function($scope,$rootScope,$window, $state, $stateParams,currentTeam,fileService, $cookieStore, authService, userService, materialRequest, materialRequestService, quoteService) {
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

  if ($scope.currentTeam.type != 'builder' && contractorRequest.owner._id != currentTeam._id) {
    $state.go('team.manager');
  }

  $scope.user = {};
  $scope.toSupplier = {};
  $scope.message = {};

  fileService.getFileByStateParam({id: $stateParams.packageId})
  .$promise.then(function(data){
    $scope.files = data;
  });

  $rootScope.$on('addendum', function(event, data){
    $scope.materialRequest = data;
  });

  $scope.downloadFile = function(value) {
    fileService.downloadFile({id: value._id})
    .$promise.then(function(data){
      $window.open(data.url);
    });
  };

  materialRequestService.getQuoteRequestByMaterialPackge({'id':$stateParams.packageId}).$promise.then(function(data){
    $scope.quoteRequests = data;
  });

  materialRequestService.getMessageForBuilder({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.declineQuote = function(value) {
    materialRequestService.declineQuote({id: materialRequest._id, belongTo: value}).$promise.then(function(data){
      $scope.materialRequest = data;
    });
  };


  $scope.addUser = function() {
    if ($scope.toSupplier.newEmail) {
      $scope.emailsPhone.push({email: $scope.toSupplier.newEmail, phoneNumber: $scope.toSupplier.newPhoneNumber});
      $scope.toSupplier.newEmail = null;
      $scope.toSupplier.newPhoneNumber = null;
    }
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  //Todo add confirm when select quote
  $scope.selectQuote = function(value) {
    quoteService.getForMaterial({'id': value}).$promise.then(function(data) { 
        $scope.winner = data;
        $state.go('materialRequest.materialPackageInProcess', {id: data.project, packageId: data._id});
    });
  };

  $scope.sendInvitation = function() {
    materialRequestService.sendInvitationInMaterial({id: $stateParams.packageId, toSupplier: $scope.emailsPhone})
    .$promise.then(function(data){
      $scope.materialRequest = data;
    });
  };

  $scope.sendMessage = function(value) {
    if (value == 'undefined' || !value) {
    }
    else if(value != 'undefined' || value) {
      materialRequestService.sendMessage({id: $stateParams.packageId, to: value, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.messages = data;
        $scope.message.message = null;
      });  
    }
  };

  //Todo add confirm when cancel package
  $scope.cancelPackage = function() {
    materialRequestService.cancelPackage({id: $stateParams.packageId})
    .$promise.then(function(data) {
      $state.go('materials', {id: $stateParams.id})
    });
  };

});