angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $mdToast, $stateParams, peopleService, people) {
	$scope.project = $rootScope.project;
    $scope.people = people;
    $rootScope.title = "Tenders list";
    if ($rootScope.currentInviteData) {
        $scope.invite = $rootScope.currentInviteData;
        $scope.showNewTenderModal();
        $rootScope.currentInviteData = null;
    }


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

        if ($scope.people[$rootScope.currentUser.type]) {
            _.each($scope.people[$rootScope.currentUser.type], function(tender) {
                var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id == $rootScope.currentUser._id;
                    }
                });
                if (currentTendererIndex !== -1) {
                    var currentTenderer = tender.tenderers[currentTendererIndex];
                    _.each(currentTenderer.teamMember, function(member) {
                        _.remove($scope.teamMembersCanInvite, {_id: member._id});
                    });
                }
            });
        }
    };

    var loadProjectMembers = function(id) {
        // get all project team member
        $scope.membersList = [];
        _.each($rootScope.roles, function(role) {
            _.each($scope.people[role], function(tender) {
                if (_.findIndex(tender.tenderers, function(user) {
                    if (user._id) {
                        return user._id._id == $rootScope.currentUser._id;
                    }
                }) != -1) {
                    $rootScope.currentUser.type = role;
                }

                if (tender.tenderers.teamMember && tender.tenderers.teamMember.length > 0) {
                    if (_.findIndex(tender.tenderers.teamMember, function(member) {
                        return member._id == $scope.currentUser._id;
                    }) != -1) {
                        $rootScope.currentUser.type = role;
                    }
                }

                // Get team list
                if (!tender.hasSelect) {
                    $scope.membersList.push({
                        _id: tender._id,
                        tenderName: tender.tenderName,
                        tenderers: tender.tenderers
                    });
                }
            });
        });

        // get employees list
        // _.each($scope.people[$rootScope.currentUser.type].tenderers.teamMember, function(member) {
        //     $scope.membersList.push({_id: member._id, name: member.name, type: $rootScope.currentUser.type});
        // });
        switch($rootScope.currentUser.type) {
            case "builders":
                $scope.availableUserType = [
                    {value: 'addSubcontractor', text: 'Subcontractor'},
                    {value: 'addConsultant', text: 'Consultant'},
                    {value: 'addEmployee', text: 'Employee'}
                ];
                break;
            case "architects": 
                $scope.availableUserType = [
                    {value: 'addBuilder', text: 'Builder'},
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
	};

	loadProjectMembers($stateParams.id);

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
				$scope.showToast("Invitations sent successfully!");
	            $scope.cancelInviteTeamModal();
	            loadProjectMembers($stateParams.id);
	        }, function(res){
	        	$scope.showToast("Error. Something went wrong.")
	        });
			$mdDialog.hide();
		}
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };


	//Functions to handle New Tender Dialog.
	$scope.showNewTenderModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectTendersCtrl',
            resolve: {
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
	      	templateUrl: 'app/modules/project/project-tenders/new/project-tenders-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.cancelNewTenderModal = function () {
		$mdDialog.cancel();
	};
	
	$scope.tendersFilters = ['Tender 1', 'Tender 2'];
});