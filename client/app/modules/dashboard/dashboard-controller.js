angular.module('buiiltApp').controller('DashboardCtrl', function($scope, $timeout, $q, userService, $rootScope) {
    $scope.user = userService.get();
    $scope.currentProject = $rootScope.currentProject;
});
