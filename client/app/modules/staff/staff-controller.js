angular.module('buiiltApp').controller('StaffCtrl', function($scope, $timeout, $q, authService, $rootScope, teamService) {
    $scope.user = authService.getCurrentUser();
    if ($scope.user) {
        teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
            $scope.team = team;
        });
    }
    $scope.currentProject = $rootScope.currentProject;
});
