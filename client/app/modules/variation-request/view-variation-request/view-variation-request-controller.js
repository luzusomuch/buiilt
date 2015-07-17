angular.module('buiiltApp')
.controller('ViewVariationRequestCtrl', function($scope, $rootScope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, variationRequest, variationRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.emailsPhone = [];
  $scope.variationRequest = variationRequest;
  $scope.currentTeam = currentTeam;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  if (variationRequest.owner._id != currentTeam._id) {
    $state.go('team.manager');
  }
  $scope.message = {};
  $scope.addendum = {};
  $scope.addendumsScope = [];
  $scope.user = {};
console.log($scope.variationRequest);
  // variationRequestService.getQuoteRequestByContractorPackge({'id':$stateParams.packageId}).$promise.then(function(data){
  //   $scope.quoteRequests = data;
  //   _.each(data.to, function(toContractor){
  //     $scope.toContractor = toContractor;
  //   });
  // });
  fileService.getFileByStateParam({id: $stateParams.variationId})
  .$promise.then(function(data){
    $scope.files = data;
  });

  $rootScope.$on('addendum', function(event, data){
    $scope.variationRequest = data;
  });

  $scope.downloadFile = function(value) {
    fileService.downloadFile({id: value._id})
    .$promise.then(function(data){
      $window.open(data.url);
    });
  };

  variationRequestService.getMessageForBuilder({'id': $stateParams.variationId})
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
    variationRequestService.selectWinner({'id': value}).$promise.then(function(data) { 
        $scope.winner = data;
        $state.go('variationRequest.inProcess',{id:data.project, variationId: data._id});
    });
  };

  // $scope.declineQuote = function(value){
  //   variationRequestService.declineQuote({'id':value}).$promise.then(function(data){
  //     $scope.variationRequest = data;
  //   });
  // };

  $scope.sendMessage = function(value) {
    if (value == 'undefined' || !value) {
    }
    else if ($scope.message.message && value != 'undefined' || value){
      variationRequestService.sendMessage({id: $stateParams.variationId, to: value, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.messages = data;
        $scope.message.message = null;
      });
    }
  };

  //Cancel package
  $scope.cancelPackage = function() {
    variationRequestService.cancelPackage({id: $stateParams.variationId})
    .$promise.then(function(data) {
      if (data.packageType == 'contractor') {
        $state.go('contractorRequest.contractorPackageInProcess',
          {id:variationRequest.project, packageId: variationRequest.package});
      }
      else if (data.packageType == 'material') {
        $state.go('materialRequest.materialPackageInProcess',
          {id:variationRequest.project, packageId: variationRequest.package});
      }
      else if (data.packageType == 'BuilderPackage') {
        $state.go('client', {id: data.project});
      }
    });
  };
});