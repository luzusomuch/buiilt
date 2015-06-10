angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope,$rootScope, teamService, authService) {
    $scope.existedTeam = {};
    $scope.user = authService.getCurrentUser();

    // $rootScope.$on('$stateChangeSuccess', function () {
    //   $scope.currentTeam = $rootScope.currentTeam;
    // });
    // $scope.isLeader = $scope.user.team.role == 'admin' ? true : false;


    $scope.team = {
      emails : []
    };
    $scope.member = {
      email : "",
      emails : []
    };
    $scope.addUser = function() {
      $scope.member.emails.push({email: $scope.member.email});
      $scope.team.emails.push({email: $scope.member.email});
      $scope.member.email = "";
    };

    $scope.removeUser = function(index) {
      $scope.member.emails.splice(index, 1);
      $scope.team.emails.splice(index, 1);
    };

    $scope.create = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        teamService.create($scope.team, function (team) {
          $scope.currentTeam = team;
          $scope.isLeader = true;
        }, function (err) {
          console.log(err);
        });
      }
    };

    $scope.addNewMember = function(){
      teamService.addMember({id: $scope.currentTeam._id},$scope.member.emails).$promise
        .then(function(team) {
          $scope.currentTeam = team;
          $scope.member.emails = [];

        }, function(err){
          console.log(err);
        }
      );
    };

    $scope.removeMember = function(member,index){
      if (confirm("Are you sure you want to remove this member")) {
        teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
          .then(function () {
            $scope.currentTeam.member.splice(index, 1);
          }, function (err) {
            console.log(err);
          });
      }
    };
  });