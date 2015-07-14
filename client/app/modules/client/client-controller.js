angular.module('buiiltApp').controller('ClientCtrl', function($scope, team, $state, $rootScope, $timeout, $q, builderPackage) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackage = builderPackage;
    $scope.currentTeam = team;
    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'supplier') {
      $state.go('team.manager');
    }
    else {
        if (builderPackage.to.type == 'homeOwner') {
            if (team.type == 'builder') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
        else {
            if (team.type == 'builder') {
                if (builderPackage.to.team._id != team._id) {
                    $state.go('team.manager');
                }
            }
            else if (team.type == 'homeOwner') {
                if (builderPackage.owner._id != team._id) {
                    $state.go('team.manager');
                }
            }
        }
    }
});