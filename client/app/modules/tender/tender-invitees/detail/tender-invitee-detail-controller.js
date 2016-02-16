angular.module('buiiltApp').controller('tenderInviteeDetailCtrl', function($rootScope, $scope, $timeout, $q, tender, tenderService, $mdDialog, $mdToast, socket, $stateParams) {
    $scope.tender = tender;
    $rootScope.title = $scope.tender + "'s message";
});