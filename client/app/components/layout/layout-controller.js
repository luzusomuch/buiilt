angular.module('buiiltApp').controller('LayoutCtrl', function($scope, $state, authService) {
    $scope.currentUser = authService.getCurrentUser();

});