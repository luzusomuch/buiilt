angular.module('buiiltApp')
.controller('SendQuoteCtrl', function(socket,$rootScope,$scope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, builderRequest, builderPackageService, quoteService) {
    $scope.builderRequest = builderRequest;
    $scope.currentTeam = currentTeam;
    if (builderRequest.hasWinner) {
        if (builderRequest.winner._id.toString() == currentTeam._id.toString()) {
            $state.go('builderRequest.inProgress', {id: builderRequest.project._id});
        } else {
            $state.go('team.manager');
        }
    } else {
        if (_.findIndex(builderRequest.invitees, {_id:currentTeam._id}) == -1) {
            $state.go('team.manager');
        }
    }
    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    }

    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;

    $scope.showScope = true;
    $scope.showQuotes = false;
    $scope.viewMessages = true;
    $scope.defaultText = "SCOPE";

    $scope.clickShowScopes = function() {
        $scope.defaultText = "SCOPE";
        $scope.showScope = true;
        $scope.showQuotes = false;
        $scope.quote = {};
        $("div.showQuoteDetail").hide();
    };
    $scope.clickShowQuotes = function() {
        $scope.defaultText = "QUOTES";
        $scope.showScope = false;
        $scope.showQuotes = true;
    };

    $scope.viewQuoteDetail = function(quote){
        fileService.get({id: quote._id}).$promise.then(function(res){
            $scope.quote = res;
            $("div.quotesList").hide();
            $("div.showQuoteDetail").show("slide", { direction: "right" }, 500);  
        });
    };

    $scope.backToList = function(){
        $scope.quote = {};
        $("div.showQuoteDetail").hide();
        $("div.quotesList").show("slide", { direction: "left" }, 500);
    };

    $scope.quoteRequest = {};
    _.each($scope.builderRequest.messages, function(message){
        if (message.sendBy._id != $scope.currentTeam._id) {
            message.owner = false;
        }
        else {
            message.owner = true;
        }
    });

    socket.emit('join',$scope.builderRequest._id);

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        }
    };

    socket.on('messageInBuilderPackageTender:new', function (package) {
        $scope.builderRequest = package;
        _.each($scope.builderRequest.messages, function(message){
            if (message.sendBy._id != $scope.currentTeam._id) {
                message.owner = false;
            }
            else {
                message.owner = true;
            }
        });
    });

    $scope.sendMessage = function() {
        if ($scope.message) {
            builderPackageService.sendMessageToArchitect({id: builderRequest._id, to: $scope.currentTeam._id, message: $scope.message})
            .$promise.then(function(data) {
                $scope.contractorRequest = data;
                $scope.message = null;
                _.each($scope.contractorRequest.messages, function(message){
                    if (message.sendBy._id != $scope.currentTeam._id) {
                        message.owner = false;
                    }
                    else {
                        message.owner = true;
                    }
                });
            });
        }
    };
});