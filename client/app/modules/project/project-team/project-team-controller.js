angular.module('buiiltApp').controller('projectTeamCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $mdToast, $stateParams, userService, people, $state, dialogService, contactBooks) {
    $scope.people = people;
    $scope.dialogService = dialogService;
    $scope.invite = {
        isTender: false
    };

    $scope.hasPrivilageInProjectMember = $rootScope.checkPrivilageInProjectMember($scope.people);

    $scope.querySearch = function(query) {
        var result = query ? contactBooks.filter(function(contact) {
            return contact.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
        }) : [];
        return result;
    };

    $scope.$watch("selectedItem", function(value) {
        if (value) {
            $scope.invite.name = value.name;
            $scope.invite.email = value.email;
            $scope.invite.phoneNumber = value.phoneNumber;
        }
    });

    $scope.createNewContact = function() {
        $rootScope.isCreateNewContact = true;
        $state.go("contacts.all");
        dialogService.closeModal();
    };
	
	$scope.showFilter = false;

    // filter section
    $scope.search = false;

    /*Select team tags for search*/
    $scope.selectTag = function(index, type) {
        $scope.searchResults = [];
        if (type==="all") {
            _.each($scope.teamMemberTypeTags, function(type) {
                type.select = false;
            });
        } else {
            $scope.teamMemberTypeTags[index].select = !$scope.teamMemberTypeTags[index].select;
        }
        var availableSearchTypes = $scope.availableSearchTypes = _.filter($scope.teamMemberTypeTags, {select: true});
        if (availableSearchTypes.length > 0) {
            $scope.search = true;
            _.each(availableSearchTypes, function(type) {
                if (type.value !== "internal") {
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

    /*Search member depend on search input text*/
    $scope.searchMember = function(member) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (member.name && (member.name.toLowerCase().indexOf($scope.name) > -1 || member.name.indexOf($scope.name) > -1) ) {
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

    /*
    Get members list of current user's team
    and filter out member that not in project member list
    */
	function getCurrentTeamMember() {
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

    /*Get all project members*/
	function loadProjectMembers() {
        $scope.membersList = [];
        /*If current user is project manager, add himself to project members list*/
        if ($scope.people.project.projectManager._id.toString()===$rootScope.currentUser._id.toString()) {
            var role = ($scope.people.project.projectManager.type === "builder") ? "builders" : "architects";
            $scope.membersList.push({_id: $rootScope.currentUser._id, name: $rootScope.currentUser.name, email: $rootScope.currentUser.email, phoneNumber: ($rootScope.currentUser.phoneNumber) ? $rootScope.currentUser.phoneNumber : null, type: $rootScope.currentUser.type});
        }

        _.each($rootScope.roles, function(role) {
            // This function use to get current user role in project
            _.each($scope.people[role], function(tender) {
                if (_.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id == $rootScope.currentUser._id;
                    }
                }) != -1) {
                    $rootScope.currentUser.type = role;
                    return false;
                } else {
                    _.each(tender.tenderers, function(tenderer) {
                        if (_.findIndex(tenderer.teamMember, function(member) {
                            return member._id == $rootScope.currentUser._id;
                        }) != -1) {
                            $rootScope.currentUser.type = role;
                            return false;
                        }
                    });
                }
            });
            /*Get another project members team*/
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
                                    member.role = "team-member";
                                    member.inviter = tender.tenderers[0]._id._id;
                                    if (tenderer.archivedTeamMembers && tenderer.archivedTeamMembers.indexOf(member._id) !== -1) {
                                        member.archive = true;
                                    }
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.type = role;
                            tender.tenderers[0]._id.archive = tender.archive;
                            tender.tenderers[0]._id.inviter = tender.inviter._id;
                            $scope.membersList.push(tender.tenderers[0]._id);
                        } else {
                            tender.tenderers[0].type = role;
                            tender.tenderers[0].archive = tender.archive;
                            tender.tenderers[0].inviter = tender.inviter._id;
                            $scope.membersList.push(tender.tenderers[0]);
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.type = role;
                                    member.role = "team-member";
                                    member.inviter = tender.tenderers[0]._id._id;
                                    if (tenderer.archivedTeamMembers && tenderer.archivedTeamMembers.indexOf(member._id) !== -1) {
                                        member.archive = true;
                                    }
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        // check privilage to invite project member
        $scope.isLeader = false;
        _.each($rootScope.roles, function(role) {
            _.each($scope.people[role], function(tender) {
                if (tender.hasSelect && tender.tenderers[0]._id && tender.tenderers[0]._id._id.toString()===$rootScope.currentUser._id) {
                    $scope.isLeader = true;
                    return;
                }
            });
        });

        $scope.builderTeam = _.filter($scope.membersList, {type: "builders"});
        $scope.clientTeam = _.filter($scope.membersList, {type: "clients"});
        $scope.architectTeam = _.filter($scope.membersList, {type: "architects"});
        $scope.subcontractorTeam = _.filter($scope.membersList, {type: "subcontractors"});
        $scope.consultantTeam = _.filter($scope.membersList, {type: "consultants"});

        if (!$scope.isLeader) {
            $scope.availableUserType = [
                {value: 'addEmployee', text: 'Employee'}
            ];
        } else {
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
        }

        // filter for availableUserType
        // var onceTimeInviteeRoles = ["builders", "clients", "architects"];
        // _.each(onceTimeInviteeRoles, function(role) {
        //     var removeType;
        //     switch (role) {
        //         case "builders": 
        //             removeType = "addBuilder";
        //         break;
        //         case "clients":
        //             removeType = "addClient";
        //         break;
        //         case "architects":
        //             removeType = "addArchitect";
        //         break;
        //         default:
        //         break;
        //     };
        //     _.each($scope.people[role], function(tender) {
        //         if (tender.hasSelect) {
        //             _.remove($scope.availableUserType, {value: removeType});
        //         }
        //     });
        // });

        // Add filter for team type
        $scope.teamMemberTypeTags = [
            {text: "employee", value:"internal"},
            {text: "architect", value: "architects"},
            {text: "builder", value: "builders"},
            {text: "consultant", value: "consultants"},
            {text: "sub contractor", value: "subcontractors"},
            {text: "home owner", value: "clients"}
        ];

        // Remove project member from contacts book
        _.each($scope.membersList, function(member) {
            var index = _.findIndex(contactBooks, function(contact) {
                return contact.email===member.email || contact.phoneNumber===member.phoneNumber;
            });
            if (index !== -1) {
                contactBooks.splice(index ,1);
            }
        });
        // Remove current user team type from team member can invite types list
        _.remove($scope.teamMemberTypeTags, {value: $rootScope.currentUser.type});
	};

    /*
    Get selected invite project member type
    If type is employee, call getCurrentTeamMember function
    */
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

    /*
    Only use for invite employee
    Select current team member to add him to project members
    */
    $scope.selectMember = function(index) {
        $scope.teamMembersCanInvite[index].select = !$scope.teamMembersCanInvite[index].select;
    };

    /*Add new user or team member to project members*/
	$scope.inviteNewTeamMember = function(form) {
		if (form.$valid) {
			$scope.invite.inviterType = $rootScope.currentUser.type;
            if (!$scope.invite.isTender) {
                delete $scope.invite.event;
                if ($scope.invite.isInviteTeamMember) {
                    $scope.invite.teamMember = _.filter($scope.teamMembersCanInvite, {select: true});
                    if ($scope.invite.teamMember.length === 0) {
                        dialogService.showToast("Please Specific At Least 1 Team Member...");
                        return;
                    }
                }
    			peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
    				dialogService.showToast("Invititation Has Been Sent Successfully.");
    	            dialogService.closeModal();
                    $rootScope.$broadcast("Project.Team.Invite", res);
					
					//Track Project Team Update
					mixpanel.identify($rootScope.currentUser._id);
					mixpanel.track("Member Added to Project Team");
					
    	        }, function(res){
    	        	dialogService.showToast("There Has Been An Error...")
    	        });
            } else {
                $rootScope.currentInviteData = $scope.invite;
                $state.go("project.tenders.all", {id: $stateParams.id});
                dialogService.closeModal();
            }
		}
	};

	/*Show invite team modal*/
	$scope.showInviteTeamModal = function($event) {
        if ($scope.hasPrivilageInProjectMember) {
            $scope.invite.event = $event;
    		$mdDialog.show({
    		  	targetEvent: $event,
    	      	controller: 'projectTeamCtrl',
                resolve: {
                    people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                        return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                    }],
                    contactBooks: ["contactBookService", function(contactBookService) {
                        return contactBookService.me().$promise;
                    }]
                },
    	      	templateUrl: 'app/modules/project/project-team/new/project-team-new.html',
    	      	parent: angular.element(document.body),
    	      	clickOutsideToClose: false
    	    });
        } else {
            dialogService.showToast("Not Allow");
        }
	};

	loadProjectMembers();
    getCurrentTeamMember();
    /*Update project members when invited success*/
    var updateProjectTeam = $rootScope.$on("Project.Team.Invite", function(ev, data) {
        $scope.people = data;
        loadProjectMembers();
    });

    $scope.$on('$destroy', function() {
        updateProjectTeam();
    });

    $scope.archiveMember = function(member) {
        var title = (!member.archive) ? "Archive Member" : "Unarchive Member";
        var content = "Do You Want To ";
        content += (!member.archive) ? "Archive " + member.name : "Unarchive " + member.name;
        $mdDialog.show($mdDialog.confirm().title(title).textContent(content).ariaLabel(title).ok("Yes").cancel("Cancel")).then(function() {
            if ($scope.isLeader && $scope.hasPrivilageInProjectMember && member.inviter==$rootScope.currentUser._id) {
                peopleService.archiveMember({id: $scope.people._id}, member).$promise.then(function(res) {
                    member.archive = !member.archive;
                    dialogService.showToast((member.archive) ? "You Have Arhived This Team Member." : "You Have Unarhived This Team Member.");
                }, function(err) {
                    dialogService.showToast("There Has Been An Error...");
                });
            } else {
                dialogService.showToast("This Action is Not Allowed...");
            }
        }, function() {

        });
    };
});