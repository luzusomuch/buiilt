angular.module('buiiltApp').controller('projectTeamCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $mdToast, $stateParams, userService, people, $state) {
    $scope.people = people;
    $scope.invite = {};
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
            // _.each($scope.people[role], function(tender) {
            //     if (tender.hasSelect) {
            //         var winnerTenderer = tender.tenderers[0];
            //         if (winnerTenderer._id) {
            //             $scope.membersList.push({_id: winnerTenderer._id._id, name: winnerTenderer._id.name, type: role});
            //         } else if (winnerTenderer.email) {
            //             $scope.membersList.push({email: winnerTenderer.email, type: role});
            //         }
            //     }
            // });
        });

        // get employees list
        // _.each($scope.people[$rootScope.currentUser.type], function(tender) {
        //     var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
        //         if (tenderer._id) {
        //             return tenderer._id._id == $rootScope.currentUser._id;
        //         }
        //     });
        //     if (currentTendererIndex !== -1) {
        //         var currentTenderer = tender.tenderers[currentTendererIndex];
        //         _.each(currentTenderer.teamMember, function(member) {
        //             $scope.membersList.push({_id: member._id, name: member.name, type: $rootScope.currentUser.type});
        //         });
        //     }
        // });
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
	$rootScope.$on("Project.Team.Invite", function(event, data) {
        $scope.people = data;
        loadProjectMembers($stateParams.id);
    });
});