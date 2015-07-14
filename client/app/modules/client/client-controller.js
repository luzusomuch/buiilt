angular.module('buiiltApp').controller('ClientCtrl', function($scope, team, $state, $rootScope, $timeout, $q, builderPackage) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackage = builderPackage;
    $scope.currentTeam = team;
    console.log(builderPackage);
    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'supplier' 
        || builderPackage.owner._id != currentTeam._id || builderPackage.to.team._id != currentTeam._id) {
      $state.go('team.manager');
    }
});