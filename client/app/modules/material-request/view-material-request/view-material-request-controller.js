angular.module('buiiltApp')
.controller('ViewMaterialRequestCtrl', function(socket,$scope,$rootScope,$window, $state, $stateParams,currentTeam,fileService, $cookieStore, authService, userService, materialRequest, materialRequestService, quoteService, builderPackage) {
  /**
   * quote data
   */

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
    $scope.tender = {};
    $scope.viewMessages = false;
    $("div.showTenderDetail").hide();
    $("div.tenderLists").show("slide", { direction: "left" }, 500);
  };
  $scope.currentTeam = currentTeam;

  $scope.emailsPhone = [];
  $scope.builderPackage = builderPackage;
  $scope.materialRequest = materialRequest;
  socket.emit('join',$scope.materialRequest._id);
  _.each($scope.materialRequest.to, function(item) {
    item.totalMessages = 0;
    _.each($scope.materialRequest.messages, function(message){
      if (message.sendBy._id != $scope.currentTeam._id) {
        message.owner = false;
      }
      else {
        message.owner = true;
      }
      if (message.sendBy._id == item._id) {
        item.totalMessages ++;
      }
    });
  });

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
      console.log(data);
      $scope.materialRequest = data;
      $scope.backToList();
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

  $scope.enterMessage = function ($event) {
    if ($event.keyCode === 13) {
      $event.preventDefault();
      $scope.sendMessage();
    }
  };

  socket.on('messageInTender:new', function (package) {
    $scope.materialRequest = package;
    _.each($scope.materialRequest.to, function(item) {
      _.each($scope.materialRequest.messages, function(message){
        if (message.sendBy._id != $scope.currentTeam._id) {
          message.owner = false;
        }
        else {
          message.owner = true;
        }
      });
    });
  });

  $scope.sendMessage = function() {
    if ($scope.tender._id == 'undefined' || !$scope.tender._id) {
    }
    else if($scope.tender._id != 'undefined' || $scope.tender._id) {
      materialRequestService.sendMessage({id: $stateParams.packageId, to: $scope.tender._id, team: $scope.currentTeam._id, message: $scope.message.message})
      .$promise.then(function(data) {
        $scope.materialRequest = data;
        $scope.message.message = null;
        _.each($scope.materialRequest.to, function(item) {
          _.each($scope.materialRequest.messages, function(message){
            if (message.sendBy._id != $scope.currentTeam._id) {
              message.owner = false;
            }
            else {
              message.owner = true;
            }
          });
        });
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

  $scope.selectWinnerByQuoteDocument = function(value) {
    quoteService.selectSupplierWinnerByQuoteDocument({id: $scope.materialRequest._id,selector: value}).$promise.then(function(res){
      $scope.winner = res;
      $state.go('materialRequest.materialPackageInProcess', {id: res.project, packageId: res._id});
    });
  };

});