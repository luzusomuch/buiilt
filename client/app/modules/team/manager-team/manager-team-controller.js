angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope, teams, teamService, authService) {
    $scope.existedTeam = {};
    $scope.user = authService.getCurrentUser();
    if ($scope.user) {
      teamService.getTeamByUser({'id': $scope.user._id}).$promise.then(function(team){
        $scope.existedTeam = team;
      });
    }

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

    $scope.addNewMember = function(){
      teamService.update({id: $scope.existedTeam._id, params: $scope.team.emails}, function(team) {
        $scope.teams.push(team);
      }, function(err){
        console.log(err);
      });
    };

    $scope.removeUser = function(value) {
      console.log(value);
    };
  });