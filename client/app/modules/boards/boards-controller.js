angular.module('buiiltApp')
.controller('BoardsCtrl', function ($scope, team, builderPackage) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
});