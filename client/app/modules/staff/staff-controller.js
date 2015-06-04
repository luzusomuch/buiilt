angular.module('buiiltApp').controller('StaffCtrl', function($scope, $timeout, $q, userService, $rootScope) {
    $scope.user = userService.get();
    $scope.currentProject = $rootScope.currentProject;
});
