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
        if ($scope.membersList && $scope.membersList.length > 0) {
            _.each($scope.membersList, function(member) {
                if (member._id) {
                    _.remove($scope.teamMembersCanInvite, {_id: member._id});
                }
            });
        }
	};

	function loadProjectMembers(id) {
		// get all project team member
        $scope.membersList = [];
        var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
		peopleService.getInvitePeople({id: id}).$promise.then(function(res) {
			$scope.people = res;
            _.each(roles, function(role) {
                _.each($scope.people[role], function(tender) {
                    if (_.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id == $rootScope.currentUser._id;
                        }
                    }) != -1) {
                        $rootScope.currentUser.type = role;
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (_.findIndex(tenderer.teamMember, function(member) {
                                return member._id == $scope.currentUser._id;
                            }) != -1) {
                                $rootScope.currentUser.type = role;
                            }
                        });
                    }
                });

                // Get team list
                _.each($scope.people[role], function(tender) {
                    if (tender.hasSelect) {
                        var winnerTenderer = tender.tenderers[0];
                        if (winnerTenderer._id) {
                            $scope.membersList.push({_id: winnerTenderer._id._id, name: winnerTenderer._id.name, type: role});
                        } else if (winnerTenderer.email) {
                            $scope.membersList.push({email: winnerTenderer.email, type: role});
                        }
                    }
                });
            });

            // get employees list
            _.each($scope.people[$rootScope.currentUser.type], function(tender) {
                var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id == $rootScope.currentUser._id;
                    }
                });
                if (currentTendererIndex !== -1) {
                    var currentTenderer = tender.tenderers[currentTendererIndex];
                    _.each(currentTenderer.teamMember, function(member) {
                        $scope.membersList.push({_id: member._id, name: member.name, type: $rootScope.currentUser.type});
                    });
                }
            });

            if ($scope.people.project.projectManager.type === "builder") {
                switch($rootScope.currentUser.type) {
                    case "builders":
                        $scope.availableUserType = [
                            {value: 'addClient', text: 'Client'},
                            {value: 'addArchitect', text: 'Architect'},
                            {value: 'addSubcontractor', text: 'Subcontractor'},
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "clients": 
                        $scope.availableUserType = [
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "architects": 
                        $scope.availableUserType = [
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    default:
                        $scope.availableUserType = [
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                }
            } else if ($scope.people.project.projectManager.type === "homeOwner") {
                switch($rootScope.currentUser.type) {
                    case "builders":
                        $scope.availableUserType = [
                            {value: 'addSubcontractor', text: 'Subcontractor'},
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "clients": 
                        $scope.availableUserType = [
                            {value: 'addBuilder', text: 'Builder'},
                            {value: 'addArchitect', text: 'Architect'},
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "architects": 
                        $scope.availableUserType = [
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    default:
                        $scope.availableUserType = [
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                }
            } else {
                switch($rootScope.currentUser.type) {
                    case "builders":
                        $scope.availableUserType = [
                            {value: 'addSubcontractor', text: 'Subcontractor'},
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "clients": 
                        $scope.availableUserType = [
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    case "architects": 
                        $scope.availableUserType = [
                            {value: 'addBuilder', text: 'Builder'},
                            {value: 'addClient', text: 'Client'},
                            {value: 'addConsultant', text: 'Consultant'},
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                    default:
                        $scope.availableUserType = [
                            {value: 'addEmployee', text: 'Employee'}
                        ];
                        break;
                }
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
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
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

    $scope.querySearch = function(value) {
        var results = value ? $scope.membersList.filter(createFilter(value)) : [];
        results = _.uniq(results, '_id');
        return results;
    };

    function createFilter(query) {
        return function filterFn(member) {
            console.log(member);
            if (member._id) {
                return member.name.toLowerCase().indexOf(query) > -1;
            } else {
                console.log(member.email.indexOf(query));
                return member.email.indexOf(query) > -1;
            }
        };
    };

    $scope.addChip = function() {
        $scope.search = true;
    };

    $scope.removeChip = function() {
        if ($scope.teamNames.length === 0) {
            $scope.search = false;
        }
    };

	loadProjectMembers($stateParams.id);
	
});