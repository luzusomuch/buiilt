angular.module('buiiltApp').controller('DashboardCtrl', function($scope, $timeout, $q, userService) {
    $scope.user = userService.get();
});