angular.module('buiiltApp').controller('settingsCtrl', function($rootScope, $scope, $timeout, $state, teamService, $mdToast, $mdDialog, authService) {
    $rootScope.title = "Settings"
    $scope.currentTeam = $rootScope.currentTeam;
    $scope.currentUser = $rootScope.currentUser;

    authService.getCurrentInvitation().$promise.then(function(res) {
        $scope.invitations = res;
    });
    $scope.member = {
      emails : []
    };
    $scope.team = {
        emails: []
    };
    
    function getTeamLeader(team) {
        $scope.currentUser.isleader = false;
        if (_.findIndex(team.leader, function(user) {
            return user._id == $scope.currentUser._id;
        }) != -1) {
            $scope.currentUser.isLeader = true;
        }
    };

    $scope.showModalCreateTeam = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/create-team.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.showAddNewStaffMemberModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-staff-addNew.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.cancelDialog = function() {
        $mdDialog.cancel();
    };

    $scope.createTeam = function(form) {
        if (form.$valid) {
            teamService.create($scope.team, function (team) {
                $rootScope.currentTeam = $scope.currentTeam = team;
                getTeamLeader($scope.currentTeam);
                $rootScope.$emit('TeamUpdate',team);
                $scope.cancelCreateTeam();
                $scope.showToast("Create new team successfully!");
                $state.go('settings.staff', {},{reload: true}).then(function(data){
                });
            }, function (err) {
                $scope.cancelCreateTeam();
                $scope.showToast(err);
            });
        }
    };
	
    $scope.showEditCompanyModal = function($event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-company-edit.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.saveDetail = function(form) {
        if (form.$valid) {
            teamService.update({_id : $scope.currentTeam._id},$scope.currentTeam).$promise
            .then(function(team) {
                $scope.showToast("Company details have updated successfully!");
                $scope.currentTeam = team;
                getTeamLeader($scope.currentTeam);
                $rootScope.$emit('TeamUpdate',team);
				$mdDialog.hide();
            }, function(err) {
                $scope.showToast(err);
            });
        }
    };

    $scope.addUser = function(email) {
        if (email !== '') {
            $scope.member.emails.push({email: email});
        }
    };

    $scope.removeUser = function(index) {
        $scope.member.emails.splice(index, 1);
    };

    $scope.addNewMember = function(){
        teamService.addMember({id: $scope.currentTeam._id},$scope.member.emails).$promise
        .then(function(team) {
            $scope.showToast("Add new members successfully!");
            $scope.currentTeam = team;
            $rootScope.$emit('TeamUpdate',team);
            $scope.member.emails = [];
			$mdDialog.hide();
        }, function(err){
            $scope.showToast(err);
        });
    };

    $scope.removeMember = function(member){
        var confirm = $mdDialog.confirm().title("Do you want to remove this member?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
                $scope.showToast("Delete member successfully!");
                $scope.currentTeam = team;
                $rootScope.$emit('TeamUpdate',team);
            }, function (err) {
                $scope.showToast(err);
            });
        }, function() {
            
        });
    };

    $scope.assignLeader = function(member) {
        var confirm = $mdDialog.confirm().title("Do you want assign this member to leader?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.assignLeader({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
                $scope.currentTeam = team;
                $scope.showToast("Assign leader for " + member._id.name + " successfully!");
                $rootScope.$emit('TeamUpdate',team);
            }, function(err) {
                $scope.showToast(err);
            });
        }, function() {
            
        });
    };

    $scope.leaveTeam = function() {
        var confirm = $mdDialog.confirm().title("Do you want to leave this member?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.leaveTeam({_id: $scope.currentTeam._id}).$promise
            .then(function (team) {
                $rootScope.currentTeam = {};
                $state.go($state.current, {}, {reload: true});
            }, function(err) {
                $scope.showToast(err);
            });
        }, function() {
            
        });
    };

    $scope.accept = function(invitation) {
        var confirm = $mdDialog.confirm().title("Do you want to join " + invitation.name + " team?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.acceptTeam({_id: invitation._id}).$promise
            .then(function (res) {
                $scope.currentTeam = res;
                $rootScope.$emit('TeamUpdate',res);
                $scope.showToast("Join team " + invitation.name + " successfully!");
            }, function (err) {
                $scope.showToast(err);
            });
        }, function() {
            
        });
    };

    $scope.reject = function(invitation) {
        var confirm = $mdDialog.confirm().title("Do you want to reject " + invitation.name + " member?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.rejectTeam({_id: invitation._id}).$promise
            .then(function () {
                $scope.invitations.splice(index, 1);
                $scope.showToast("Reject " +invitation.name+ "successfully!");
            }, function (err) {
                $scope.showToast(err);
            });
        }, function() {
            
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    getTeamLeader($scope.currentTeam);

});