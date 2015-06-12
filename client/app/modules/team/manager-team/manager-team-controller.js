angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope,$rootScope, validateInviteService, invitations, teamService, authService,$state) {
    $scope.existedTeam = {};
    $scope.validateInvite = null;
    $scope.invitations = invitations;

    validateInviteService.getByUser().$promise.then(function(data) {
      $scope.validateInvite = data;
    });


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

    $scope.selection = [];
    $scope.toggleSelection = function(id) {
      var idx = $scope.selection.indexOf(id);

      // is currently selected
      if (idx > -1) {
        $scope.selection.splice(idx, 1);
      }

      // is newly selected
      else {
        $scope.selection.push(id);
      }
    };

    $scope.create = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        teamService.create($scope.team, function (team) {
          $scope.currentTeam = team;
          $scope.member.emails = [];
          $scope.team.emails = [];
          $scope.isLeader = true;
        }, function (err) {
          console.log(err);
        });
      }
    };


    $scope.assignLeader = function() {
      teamService.assignLeader({id : $scope.currentTeam._id},$scope.selection).$promise
        .then(function(team) {
          $scope.currentTeam = team;
        })
    };

    $scope.leaveTeam = function() {
      if (confirm("Are you sure you want to leave this team")) {
        teamService.leaveTeam({_id: $scope.currentTeam._id}).$promise
          .then(function (team) {
            $state.go($state.current, {}, {reload: true});
          })
      }
    }

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