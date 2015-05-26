angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope, teams, teamService) {
    $scope.teams = teams;
    $scope.team = {};
    $scope.create = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        teamService.create($scope.team, function (team) {
          $scope.teams.push(team);
        }, function (err) {
          console.log(err);
        });
      }
    };
  });