angular.module('buiiltApp').controller('StaffCtrl', function($scope, $timeout, $q, userService) {
    $scope.user = userService.get();
});