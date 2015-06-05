angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $rootScope, $timeout, $q, userService) {
    $scope.user = userService.get();
    $scope.currentProject = $rootScope.currentProject;
});