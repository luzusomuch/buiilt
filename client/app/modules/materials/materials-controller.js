angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $rootScope, $timeout, $q, authService, teamService) {
    $scope.user = authService.getCurrentUser();
    if ($scope.user) {
        teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
            $scope.team = team;
        });
    }
    $scope.currentProject = $rootScope.currentProject;
});