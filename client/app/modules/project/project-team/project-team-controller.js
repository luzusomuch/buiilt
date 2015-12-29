angular.module('buiiltApp').controller('projectTeamCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $mdToast, $stateParams) {
	function getCurrentTeamMember() {
		//get current user logged in team member
		$scope.teamMembersCanInvite = $rootScope.currentTeam.leader;
		_.each($rootScope.currentTeam.member, function(member) {
			if (member._id && member.status === "Active") {
				$scope.teamMembersCanInvite.push(member._id);
			}
		});
		$scope.teamMembersCanInvite = _.uniq($scope.teamMembersCanInvite, '_id');
		_.remove($scope.teamMembersCanInvite, {_id: $rootScope.currentUser._id});
	};

	function loadProjectMembers(id) {
		// get all project team member
		peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res) {
			$scope.people = res;
			if ($scope.people.projectManager._id === $rootScope.currentUser._id) {
				$rootScope.currentUser.type = "projectManager";
			} else if (_.findIndex($scope.people.builders, function(item) {
                if (item._id) {
                    return item._id._id == $rootScope.currentUser._id;
                }}) != -1) {
                $rootScope.currentUser.type = 'builder';
            } else if (_.findIndex($scope.people.architects, function(item) {
                if (item._id) {return item._id._id == $rootScope.currentUser._id;}
                }) != -1) {
                $rootScope.currentUser.type = 'architect';
            } else if (_.findIndex($scope.people.clients, function(item){
                if (item._id) {return item._id._id == $rootScope.currentUser._id;}
                }) != -1) {
                $rootScope.currentUser.type = 'client';
            } else if (_.findIndex($scope.people.subcontractors, function(item){
                if (item._id) {return item._id._id == $rootScope.currentUser._id;}
                }) != -1) {
                $rootScope.currentUser.type = 'subcontractor';
            } else if (_.findIndex($scope.people.consultants, function(item){
                if (item._id) {return item._id._id == $rootScope.currentUser._id;}
                }) != -1) {
                $rootScope.currentUser.type = 'consultant';
            } else {
            	if (_.findIndex($scope.people.projectManager.teamMember, function(member) {
            		return member._id == $rootScope.currentUser._id;
            	}) != -1) {
            		$rootScope.currentUser.type = 'projectManager';
            	}

                _.each($scope.people.builders, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $rootScope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = 'builder';
                        return false;
                    }
                });

                _.each($scope.people.clients, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $rootScope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = 'client';
                        return false;
                    }
                });

                _.each($scope.people.architects, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $rootScope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = 'architect';
                        return false;
                    }
                });

                _.each($scope.people.subcontractors, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $rootScope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = 'subcontractor';
                        return false;
                    }
                });

                _.each($scope.people.consultants, function(item) {
                    if (_.findIndex(item.teamMember, function(member) {
                        return member._id == $rootScope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = 'consultant';
                        return false;
                    }
                });
            }

			switch($rootScope.currentUser.type) {
				case "projectManager":
					$scope.availableUserType = [
                        {value: 'addBuilder', text: 'Builder'},
                        {value: 'addClient', text: 'Client'},
                        {value: 'addArchitect', text: 'Architect'},
                        {value: 'addSubcontractor', text: 'Subcontractor'},
                        {value: 'addConsultant', text: 'Consultant'},
                        {value: 'addEmployee', text: 'Employee'}
                    ];
                    break;
                default:
                	break;
			}
		});
	};

	$scope.getChangeTypeValue = function(type) {
		if (type === 'addClient' || type === "addEmployee") {
			$scope.invite.isTender = false;
			if (type == 'addEmployee') {
				getCurrentTeamMember();
                $scope.invite.isInviteTeamMember = true;
            } else {
                $scope.invite.isInviteTeamMember = false;
            }
		} else {
			$scope.invite.isTender = true;
            $scope.invite.isInviteTeamMember = false;
		}
		$scope.invite.teamMember = [];
        $scope.invite.invitees = [];
	};

	$scope.inviteTeamMember = function(member, index) {
        $scope.invite.teamMember.push(member);
        $scope.teamMembersCanInvite.splice(index,1);
        member.canRevoke = true;
    };

	$scope.revokeTeamMember = function(member, index) {
        $scope.teamMembersCanInvite.push(member);
        $scope.invite.teamMember.splice(index, 1);
        member.canRevoke = false;
    };

	$scope.addInvitee = function(email) {
		if (email && email != '') {
            $scope.invite.invitees.push({email: email});
            $scope.email = null;
        }
	};	

	$scope.removeInvitee = function(index) {
        $scope.invite.invitees.splice(index, 1);
    };

	$scope.inviteNewTeamMember = function(form) {
		if (form.$valid) {
			$scope.invite.inviterType = $rootScope.currentUser.type;
			peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
				$scope.showToast("Invited successfully");
	            $scope.cancelInviteTeamModal();
	            loadProjectMembers($stateParams.id);
	        }, function(res){
	        	$scope.showToast("Error. Something went wrong.")
	        });
		}
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('top','right').hideDelay(3000));
    };

	//Functions to handle Invite Team Dialog.
	$scope.showInviteTeamModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectTeamCtrl',
	      	templateUrl: 'app/modules/project/project-team/new/project-team-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.cancelInviteTeamModal = function () {
		$mdDialog.cancel();
	};
	
	//Placeholder Set of Filters to use for layout demo
	$scope.teamNames = ['Bob', 'Jane', 'Tmart'];
	
	//Placeholder Array of Team Members to use for layout demo
	$scope.teamMembers = [
		{'name': 'John Condon', 'role': 'Builder'},
		{'name': 'Myles Condon', 'role': 'Employee'},
		{'name': 'Ken Van Bran', 'role': 'Architect'},
		{'name': 'Brett Church', 'role': 'Architect'},
		{'name': 'Jack Lock', 'role': 'Home Owner'},
		{'name': 'Andy Romee', 'role': 'Consultant'}
	];

	loadProjectMembers($stateParams.id);
	
});