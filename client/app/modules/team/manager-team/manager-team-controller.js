angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope, teams, teamService) {
    $scope.teams = teams;
    $scope.team = {};
    $scope.team.emails = [];

    $scope.addUser = function() {
      $scope.team.emails.push({email: $scope.team.userEmail});
    };

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