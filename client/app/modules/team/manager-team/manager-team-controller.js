angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope,$rootScope, invitations, teamService, authService) {
    $scope.existedTeam = {};
    $scope.invitations = invitations;


    $scope.filterByStatus = function (item) {
      return item.status === 'waiting' || item.status === 'reject';
    };

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

    $scope.removeMember = function(member){
      if (confirm("Are you sure you want to remove this member")) {
        teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
          .then(function (team) {
            $scope.currentTeam = team;
          }, function (err) {
            console.log(err);
          });
      }
    };

    $scope.removeInvitation = function(member) {
      if (confirm("Are you sure you want to remove this invitation")) {
        teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
          .then(function (team) {
            $scope.currentTeam = team;
          }, function (err) {
            console.log(err);
          });
      }
    };

    $scope.accept = function(invitation) {
      console.log(invitation._id);
      if (confirm("Are you sure you want to join this team")) {
        teamService.acceptTeam({_id: invitation._id}).$promise
          .then(function (res) {
            $scope.currentTeam = res;
          }, function (err) {
            console.log(err);
          });
      }
    };

    $scope.reject = function(invitation,index) {
      if (confirm("Are you sure you want to join this team")) {
        teamService.rejectTeam({_id: invitation._id}).$promise
          .then(function () {
            $scope.invitations.splice(index, 1);
          }, function (err) {
            console.log(err);
          });
      }
    }
  });