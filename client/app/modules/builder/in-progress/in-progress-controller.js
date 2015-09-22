angular.module('buiiltApp')
.controller('InProgressCtrl', function(socket,$rootScope,$scope, $window, $state, $stateParams,fileService,currentTeam, $cookieStore, authService, userService, builderRequest, builderPackageService, quoteService) {
    $scope.builderRequest = builderRequest;
});