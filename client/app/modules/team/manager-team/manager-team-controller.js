angular.module('buiiltApp')
  .controller('TeamCtrl', function ($scope,$rootScope, validateInviteService, invitations,users,currentUser, currentTeam, teamService, authService,$state,userService,filterFilter,Modal) {
    $scope.existedTeam = {};
    $scope.validateInvite = null;
    $scope.invitations = invitations;
    $scope.currentTeam = currentTeam;
    $scope.currentUser = currentUser;
    $scope.users = users;
    $scope.clear = false;
    $scope.isEdit = false;
    $scope.isLeader = (currentUser.team.role == 'admin');


    var getLocalData = function() {
      _.forEach($scope.currentTeam.member,function(member) {
        if (member._id)
          _.remove($scope.users, {_id : member._id._id});
      });
      _.remove($scope.users, {_id : $scope.currentUser._id});
    }

    getLocalData();

    $scope.editDetail = function() {
      $scope.isEdit = true;
    };

    $scope.saveDetail = function() {
      teamService.update({_id : $scope.currentTeam._id},$scope.currentTeam).$promise
        .then(function(team) {
          $scope.currentTeam = team;
          $rootScope.$emit('TeamUpdate',team);
          $scope.isEdit = false;
        })
    };



    $scope.filterByStatus = function (item) {
      return item.status === 'waiting' || item.status === 'reject';
    };

    $scope.team = {
      emails : []
    };
    $scope.member = {
      email : {},
      emails : []
    };
    $scope.addUser = function() {
      if ($scope.member.email.title) {
          if (!(_.find($scope.member.emails,{email : $scope.member.email.title}))) {
            $scope.member.emails.push({email: $scope.member.email.title});
            $scope.team.emails.push({email: $scope.member.email.title});
            _.remove($scope.users, {email : $scope.member.email.title});
            $scope.member.email = {};
          }
      } else {
        if ($scope.textString)
          if (!(_.find($scope.member.emails,{email : $scope.textString}))) {
            $scope.member.emails.push({email: $scope.textString});
            $scope.team.emails.push({email: $scope.textString});
           // $scope.member.email = {};
          }
      }
      $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.inputChanged = function(str) {
      $scope.textString = str;
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
          $rootScope.$emit('TeamUpdate',team);
          $scope.member.emails = [];
          $scope.team.emails = [];
          $rootScope.isLeader = true;
          getLocalData();
        }, function (err) {
        });
      }
    };

    //Todo add confirm when asign leader
    $scope.assignLeader = function(member) {
      Modal.confirm('Are you sure you want to assign this member as leader',function(confirm) {
        if (confirm) {
          teamService.assignLeader({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
              $scope.currentTeam = team;
              $rootScope.$emit('TeamUpdate',team);
              getLocalData();
            })
        }
      });
    };

    //Todo add confirm when leave team
    $scope.leaveTeam = function() {
      Modal.confirm('Are you sure you want to leave this team',function(confirm) {
        if (confirm) {
          teamService.leaveTeam({_id: $scope.currentTeam._id}).$promise
            .then(function (team) {
              $state.go($state.current, {}, {reload: true});
            })
        }
      })
    };

    $scope.addNewMember = function(){
      teamService.addMember({id: $scope.currentTeam._id},$scope.member.emails).$promise
        .then(function(team) {
          $scope.currentTeam = team;
          $rootScope.$emit('TeamUpdate',team);
          $scope.member.emails = [];
          getLocalData();

        }, function(err){
        }
      );
    };

    //Todo add confirm when remove member
    $scope.removeMember = function(member){
      Modal.confirm('Are you sure you want to remove this member',function(confirm) {
        if (confirm) {
          teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
              $scope.currentTeam = team;
              $rootScope.$emit('TeamUpdate',team);
              getLocalData();
            }, function (err) {
            });
        }
      })
    };

    //Todo add confirm when remove invitation
    $scope.removeInvitation = function(member) {
      Modal.confirm('Are you sure you want to reject this invitation',function(confirm) {
        if (confirm) {
          teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
              $scope.currentTeam = team;
              $rootScope.$emit('TeamUpdate',team);
            }, function (err) {
            });
        }
      })
    };

    //Todo add confirm when join team
    $scope.accept = function(invitation) {
      Modal.confirm('Are you sure you want to aceept this invitation',function(confirm) {
        if (confirm) {
          teamService.acceptTeam({_id: invitation._id}).$promise
            .then(function (res) {
              $scope.currentTeam = res;
              $rootScope.$emit('TeamUpdate',res);
              getLocalData();
            }, function (err) {
            });
        }
      })
    };

    //Todo add confirm when reject team
    $scope.reject = function(invitation,index) {
      Modal.confirm('Are you sure you want to reject this invitation',function(confirm) {
        if (confirm) {
          teamService.rejectTeam({_id: invitation._id}).$promise
            .then(function () {
              $scope.invitations.splice(index, 1);
              getLocalData();
            }, function (err) {
            });
        }
      })
    }
  });