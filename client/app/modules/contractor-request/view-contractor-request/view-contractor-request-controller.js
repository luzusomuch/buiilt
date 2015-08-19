angular.module('buiiltApp')
.controller('ViewContractorRequestCtrl', function($rootScope,$scope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  $scope.activeHover = function($event){
    angular.element($event.currentTarget).addClass("item-hover")
  };
  $scope.removeHover = function($event) {
    angular.element($event.currentTarget).removeClass("item-hover")
  }
    
  $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

  $scope.showScope = true;
  $scope.showTenders = false;
  $scope.viewMessages = false;
  $scope.defaultText = "SCOPE";

  $scope.clickShowScopes = function() {
    $scope.defaultText = "SCOPE";
    $scope.showScope = true;
    $scope.showTenders = false;
  };
  $scope.clickShowTenders = function() {
    $scope.defaultText = "TENDERS";
    $scope.showScope = false;
    $scope.showTenders = true;
  };

  $scope.viewTenderDetail = function(tender){
    $scope.viewMessages = true;
    $scope.tender = tender;
    $("div.tenderLists").hide();
    $("div.showTenderDetail").show("slide", { direction: "right" }, 500);
  };

  $scope.backToList = function(){
    $scope.viewMessages = false;
    $scope.tender = {};
    $("div.showTenderDetail").hide();
    $("div.tenderLists").show("slide", { direction: "left" }, 500);
  };

  $scope.emailsPhone = [];
  $scope.contractorRequest = contractorRequest;
  _.each($scope.contractorRequest.to, function(item) {
    item.totalMessages = 0;
    _.each($scope.contractorRequest.messages, function(message){
      if (message.sendBy._id == item._id) {
        item.totalMessages ++;
      }
    });
  });
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
      $scope.backToList();
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

  $scope.enterMessage = function ($event) {
    if ($event.keyCode === 13) {
      $event.preventDefault();
      $scope.sendMessage();
    }
  };

  $scope.sendMessage = function() {
    if ($scope.tender._id == 'undefined' || !$scope.tender._id) {
    }
    else if ($scope.tender._id != 'undefined' || $scope.tender._id){
      contractorRequestService.sendMessage({id: $stateParams.packageId, to: $scope.tender._id, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.contractorRequest = data;
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

  //select winner by quote document -- new requirement
  $scope.selectWinnerByQuoteDocument = function(value) {
    quoteService.selectContractorWinnerByQuoteDocument({id: $scope.contractorRequest._id,selector: value}).$promise.then(function(res){
      $scope.winner = res;
      $state.go('contractorRequest.contractorPackageInProcess', {id: res.project, packageId: res._id});
    });
  };
});