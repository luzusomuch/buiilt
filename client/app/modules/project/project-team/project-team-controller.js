angular.module('buiiltApp').controller('projectTeamCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $mdToast, $stateParams, userService, people, $state) {
    $scope.people = people;
    $scope.invite = {
        isTender: false
    };

    // filter section
    $scope.search = false;
    $scope.teamMemberTypeTags = [
        {text: "internal", value:"internal"},
        {text: "architect", value: "architects"},
        {text: "builder", value: "builders"},
        {text: "consultant", value: "consultants"},
        {text: "sub contractor", value: "subcontractors"},
        {text: "home owner", value: "clients"}
    ];

    $scope.selectTag = function(index) {
        $scope.searchResults = [];
        $scope.teamMemberTypeTags[index].select = !$scope.teamMemberTypeTags[index].select;
        var availableSearchTypes = _.filter($scope.teamMemberTypeTags, {select: true});
        if (availableSearchTypes.length > 0) {
            $scope.search = true;
            _.each(availableSearchTypes, function(type) {
                if (type !== "internal") {
                    _.each($scope.membersList, function(member) {
                        if (member.type === type.value) {
                            $scope.searchResults.push(member);
                        }
                    });
                } else {
                    $scope.searchResults = _.union($scope.searchResults, $scope.internalTeam);
                }
            });
            $scope.searchResults = _.uniq($scope.searchResults, "_id");
        } else {
            $scope.search = false;
        }
    };

    $scope.searchMember = function(member) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (member.name && member.name.toLowerCase().indexOf($scope.name) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.email && $scope.email.length > 0) {
            var found = false;
            if (member.email && member.email.toLowerCase().indexOf($scope.email) > -1) {
                found = true;
            }
            return found;
        } else {
            return true;
        }
    };
    // end filter section

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
        $scope.internalTeam = angular.copy($scope.teamMembersCanInvite);
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
        _.each($rootScope.roles, function(role) {
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
                            return member._id == $rootScope.currentUser._id;
                        }) != -1) {
                            $rootScope.currentUser.type = role;
                        }
                    });
                }
            });

            // Get team list
            _.each($scope.people[role], function(tender){
                if (tender.hasSelect) {
                    var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                        }
                    }) !== -1) ? true : false;
                    if (!isLeader) {
                        _.each(tender.tenderers, function(tenderer) {
                            var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                return member._id.toString() === $rootScope.currentUser._id.toString();
                            });
                            if (memberIndex !== -1) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.type = role;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.type = role;
                            $scope.membersList.push(tender.tenderers[0]._id);
                        } else {
                            tender.tenderers[0].type = role;
                            $scope.membersList.push(tender.tenderers[0]);
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.type = role;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
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

        // filter for availableUserType
        var onceTimeInviteeRoles = ["builders", "clients", "architects"];
        _.each(onceTimeInviteeRoles, function(role) {
            var removeType;
            switch (role) {
                case "builders": 
                    removeType = "addBuilder";
                break;
                case "clients":
                    removeType = "addClient";
                break;
                case "architects":
                    removeType = "addArchitect";
                break;
                default:
                break;
            };
            _.each($scope.people[role], function(tender) {
                if (tender.hasSelect) {
                    _.remove($scope.availableUserType, {value: removeType});
                }
            });
        });
	};

	$scope.getChangeTypeValue = function(type) {
		$scope.invite.isTender = false;
        if (type === 'addClient' || type === "addEmployee") {
			if (type == 'addEmployee') {
				getCurrentTeamMember();
                $scope.invite.isInviteTeamMember = true;
            } else {
                $scope.invite.isInviteTeamMember = false;
            }
		} else {
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

    $scope.selectMember = function(index) {
        $scope.teamMembersCanInvite[index].select = !$scope.teamMembersCanInvite[index].select;
    };

	$scope.addInvitee = function(email, name) {
		if (email && email != '' && name && name != '') {
            if (_.findIndex($scope.invite.invitees, {email: email}) === -1) {
                $scope.invite.invitees.push({email: email, name: name});
                $scope.email = null;
                $scope.name = null;
            } else {
                $scope.showToast("This email has already added");
            }   
        }
	};	

	$scope.removeInvitee = function(index) {
        $scope.invite.invitees.splice(index, 1);
    };

    $scope.setInviteTender = function(value) {
        $scope.invite.isTender = value;
        if (value) {
            $rootScope.currentInviteData = $scope.invite;
            $state.go("project.tenders.all", {id: $stateParams.id});
            $scope.cancelInviteTeamModal();
        }
    };

	$scope.inviteNewTeamMember = function(form) {
		if (form.$valid) {
			$scope.invite.inviterType = $rootScope.currentUser.type;
            if (!$scope.invite.isTender) {
                delete $scope.invite.event;
                if ($scope.invite.isInviteTeamMember) {
                    $scope.invite.teamMember = _.filter($scope.teamMembersCanInvite, {select: true});
                    if ($scope.invite.teamMember.length === 0) {
                        $scope.showToast("Please select at least 1 member");
                        return;
                    }
                }
    			peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
    				$scope.showToast("Invited successfully");
    	            $scope.cancelInviteTeamModal();
                    $rootScope.$broadcast("Project.Team.Invite", res);
    	        }, function(res){
    	        	$scope.showToast("Error. Something went wrong.")
    	        });
            } else {
                $rootScope.currentInviteData = $scope.invite;
                $state.go("project.tenders.all", {id: $stateParams.id});
                $scope.cancelInviteTeamModal();
            }
		}
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

	//Functions to handle Invite Team Dialog.
	$scope.showInviteTeamModal = function($event) {
        $scope.invite.event = $event;
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectTeamCtrl',
            resolve: {
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
	      	templateUrl: 'app/modules/project/project-team/new/project-team-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.cancelInviteTeamModal = function () {
		$mdDialog.cancel();
	};

	loadProjectMembers($stateParams.id);
    getCurrentTeamMember();
	$rootScope.$on("Project.Team.Invite", function(event, data) {
        $scope.people = data;
        loadProjectMembers($stateParams.id);
    });
});