angular.module('buiiltApp')
.controller('ViewRequestCtrl', function(socket,$rootScope,$scope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, builderRequest, contractorRequestService, quoteService, builderPackageService) {
  console.log(builderRequest);
    $scope.builderRequest = builderRequest;
    if ($scope.builderRequest.hasWinner) {
        $state.go('builderRequest.inProgress', {id: $scope.builderRequest.project._id});
    }
    $scope.defaultText = "SCOPE";
    $scope.showScope = true;
    $scope.showTenders = false;
    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;
    $scope.messageScreenHeight = $scope.contentHeight - 135;

    $scope.clickShowScopes = function(){
        $scope.defaultText = "SCOPE";
        $scope.showScope = true;
        $scope.showTenders = false;
    };
    $scope.clickShowTenders = function(){
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

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    };

    $scope.emailsPhone = [];
    socket.emit('join',$scope.builderRequest._id);
    authService.getCurrentUser().$promise.then(function(res){
        $scope.currentUser = res;
        _.each($scope.builderRequest.invitees, function(item){
            item.totalMessages = 0;
            _.each($scope.builderRequest.messages, function(message){
                if (message.sendBy._id != $scope.currentTeam._id) {
                    message.owner = false;
                } else {
                    message.owner = true;
                }
                if (message.sendBy._id == item._id) {
                    item.totalMessages++;
                }
            });
        });
    });

    $scope.message = {};
    $scope.user = {};

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

    $scope.declineQuote = function(value) {
        builderPackageService.declineQuote({id: builderRequest._id, belongTo: value}).$promise.then(function(data){
            $scope.builderRequest = data;
            $scope.backToList();
        });
    };

    $scope.selectWinnerByQuoteDocument = function(value) {
        builderPackageService.selectWinner({id: builderRequest._id,selector: value}).$promise.then(function(res){
            $scope.winner = res;
            $state.go('builderRequest.inProgress', {id: res.project});
        });
    };

    //invite new builder team to submit quote
    $scope.inviteBuilder = function() {
        builderPackageService.inviteBuilder({id: $scope.builderRequest._id, toBuilder: $scope.emailsPhone})
        .$promise.then(function(data){
            $scope.builderRequest = data;
        });
    };

    //messages section
    socket.on('messageInBuilderPackageTender:new', function (package) {
        $scope.builderRequest = package;
        _.each($scope.builderRequest.invitees, function(item) {
            _.each($scope.builderRequest.messages, function(message){
                if (message.sendBy._id != $scope.currentTeam._id) {
                    message.owner = false;
                }
                else {
                    message.owner = true;
                }
          });
        });
    });

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
            builderPackageService.sendMessage({id: builderRequest._id, to: $scope.tender._id, owner: $scope.currentTeam._id, message: $scope.message.message})
            .$promise.then(function(data) {
                $scope.builderRequest = data;
                $scope.message.message = null;
                _.each($scope.builderRequest.invitees, function(item) {
                    _.each($scope.builderRequest.messages, function(message){
                        if (message.sendBy._id != $scope.currentTeam._id) {
                            message.owner = false;
                        } else {
                            message.owner = true;
                        }
                    });
                });
            });
        }
    };  
});