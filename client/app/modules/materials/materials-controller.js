angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $timeout, $q, userService) {
    $scope.user = userService.get();
});