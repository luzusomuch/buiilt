angular.module('buiiltApp').controller('settingsCtrl', function($rootScope, $scope, $timeout, $state, teamService, $mdToast, $mdDialog, authService, userService, stripe, projectService, $state, currentUser) {
    $rootScope.title = "Settings"
    $scope.currentTeam = $rootScope.currentTeam;
    $rootScope.currentUser = null;
    $rootScope.currentUser = $scope.currentUser = currentUser;
    function getCurrentUserPlan() {
        if ($scope.currentUser.plan) {
            $scope.currentUser.noPlan = false;
            switch($scope.currentUser.plan) {
                case "small":
                    $scope.currentUser.smallPlan = true;
                break;
                case "medium":
                    $scope.currentUser.mediumPlan = true;
                break;
                case "large":
                    $scope.currentUser.largePlan = true;
                break;
                default:
                break;
            }
        } else {
            $scope.currentUser.noPlan = true;
        }
    };
    getCurrentUserPlan();

    function getUserProjects() {
        $scope.projects = [];
        $scope.totalProject = 0;
        _.each($scope.currentUser.projects, function(project) {
            if (project.owner == $scope.currentUser._id && project.status !== "archive") {
                $scope.totalProject += 1;
                $scope.projects.push(project);
            }
        });
    };
    getUserProjects();

    $timeout(function() {
        if (!$rootScope.currentTeam._id) {
            teamService.isWaitingTeamAccept().$promise.then(function(data) {
                $scope.isWaitingTeamAccept = data.data;    
                if (!$scope.isWaitingTeamAccept) {
            		inline_manual_player.activateTopic('10595');
            		
                    $mdDialog.show({
                        controller: ["$scope", "$mdDialog", function($scope, $mdDialog){
                            $scope.showCreateOrJoinTeam = function($event, type) {
                                $mdDialog.cancel();
                                if (type === "create") {
            						
            						inline_manual_player.activateTopic('10596');
            						
                                    $mdDialog.show({
                                        targetEvent: $event,
                                        controller: ["$rootScope", "$scope", "$mdToast", "$mdDialog", "teamService", "$state", 
                                        function($rootScope, $scope, $mdToast, $mdDialog, teamService, $state){
                                            $scope.team = {
                                                emails: [],
                                            };

                                            $scope.getTeamType = function(type) {
                                                if (type == "homeOwner") {
                                                    $scope.team.name = $rootScope.currentUser.name;
                                                } else {
                                                    $scope.team.name = '';
                                                }
                                            };

                                            $scope.showToast = function(value) {
                                                $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
                                            };

                                            $scope.createTeam = function(form) {
                                                if (form.$valid) {
                                                    teamService.create($scope.team, function (team) {
                                                        $rootScope.currentTeam = $scope.currentTeam = team;
                                                        $rootScope.$emit('TeamUpdate',team);
                                                        $mdDialog.cancel();
                                                        $scope.showToast("You Have Successfully Created Your Team.");
                                                        
                                                        //Track Team Creation
                                                        mixpanel.identify($rootScope.currentUser._id);
                                                        mixpanel.track("Team Created");
                                                        
                                                        $state.go('settings.staff', {},{reload: true}).then(function(data){});
                                                    }, function (err) {
                                                        $scope.showToast("There Has Been An Error...");
                                                    });
                                                }
                                            };
                                        }],
                                        templateUrl: 'app/modules/settings/partials/create-team.html',
                                        parent: angular.element(document.body),
                                        clickOutsideToClose: false,
                                        escapeToClose: false
                                    });
                                } else {
            						
            						inline_manual_player.activateTopic('10597');
            						
                                    $mdDialog.show({
                                        targetEvent: $event,
                                        controller: ["$rootScope", "$scope", "mdToast", "mdDialog", "teamService", "$state", "invitations", "team", 
                                        function($rootScope, $scope, $mdToast, $mdDialog, teamService, $state, invitations, teams){
                                            $scope.invitations = invitations;
                                            $scope.teams = teams;

                                            $scope.showToast = function(value) {
                                                $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
                                            };

                                            $scope.accept = function(invitation) {
                                                var confirm = $mdDialog.confirm().title("Do you want to accept this invitation?").ok("Yes").cancel("No");
                                                $mdDialog.show(confirm).then(function() {
                                                    teamService.acceptTeam({_id: invitation._id}).$promise
                                                    .then(function (res) {
                                                        $rootScope.currentTeam = $scope.currentTeam = team;
                                                        $rootScope.$emit('TeamUpdate',team);
                                                        $scope.showToast("Successfully");
                                                        $state.go('settings.staff', {},{reload: true}).then(function(data){});
                                                    }, function (err) {
                                                        $scope.showToast("There Has Been An Error...");
                                                    });
                                                }, function() {
                                                    
                                                });
                                            };

                                            $scope.reject = function(invitation, index) {
                                                var confirm = $mdDialog.confirm().title("Do you want to reject this invitation?").ok("Yes").cancel("No");
                                                $mdDialog.show(confirm).then(function() {
                                                    teamService.rejectTeam({_id: invitation._id}).$promise
                                                    .then(function () {
                                                        $scope.invitations.splice(index, 1);
                                                        $scope.showToast("Successfully");
                                                        $state.go('settings.staff', {},{reload: true}).then(function(data){});
                                                    }, function (err) {
                                                        $scope.showToast("There Has Been An Error...");
                                                    });
                                                }, function(){});
                                            };

                                            $scope.querySearch = function(value) {
                                                var result = value ? $scope.teams.filter(filterFunction(value)) : null;
                                                return result;
                                            };

                                            function filterFunction(value){
                                                return function filterFn(team) {
                                                    return (team.name.toLowerCase().indexOf(value) > -1 || team.name.indexOf(value) > -1);
                                                }
                                            };

                                            $scope.selectedItemChange = function(item) {
                                                $scope.selectedTeam = item;
                                            };

                                            $scope.sendJoinTeamRequest = function() {
                                                if ($scope.selectedTeam._id) {
                                                    teamService.sendJoinTeamRequest({id: $scope.selectedTeam._id}).$promise.then(function(res) {
                                                        $scope.showToast("Successfully! Please wait until that team leader accept your request");
                                                        $mdDialog.cancel();
                                                        $state.go('settings.staff', {},{reload: true}).then(function(data){});
                                                    }, function(err){$scope.showToast("There Has Been An Error...");});
                                                } else {
                                                    $scope.showToast("Please select a team");
                                                }
                                            };
                                            
                                        }],
                                        templateUrl: 'app/modules/settings/partials/join-team.html',
                                        resolve: {
                                            invitations: ["authService", function(authService) {
                                                return authService.getCurrentInvitation().$promise;
                                            }],
                                            teams: ["teamService", function(teamService) {
                                                return teamService.getAll().$promise;
                                            }]
                                        },
                                        parent: angular.element(document.body),
                                        clickOutsideToClose: false,
                                        escapeToClose: false
                                    });
                                }
                            };
                        }],
                        templateUrl: 'app/modules/settings/partials/create-or-join.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: false,
                        escapeToClose: false
                    });
                }
            });
        }
    }, 500);

    var handler = StripeCheckout.configure({
        key: 'pk_test_WGKFaZu6dXITEIxoyVI8DrVa',
        image: '/128x128.png',
        locale: 'auto',
        email: $scope.currentUser.email,
        token: function(token) {
          // Use the token to create the charge with a server-side script.
          // You can access the token ID with `token.id`
            var data = {stripeEmail: token.email, stripeToken: token.id, stripeType: token.type, plan: $rootScope.purchaseType};
            userService.buyPlan({}, data).$promise.then(function(res) {
                handler.close();
                $rootScope.$emit("User.Update", res);
            }, function(err) {$scope.showToast(err.data);})
        }
    });

    $scope.plans = {
        small : {name: "Small plan", description: "Purchase for small plan ($45.00)", amount: 4500, currency: "aud"},
        medium : {name: "Medium plan", description: "Purchase for medium plan ($80.00)", amount: 8000, currency: "aud"},
        large : {name: "Large plan", description: "Purchase for large plan ($105.00)", amount: 10500, currency: "aud"},
    };
    
    $rootScope.$on("User.Update", function(event, data) {
        $rootScope.currentUser = null;
        $rootScope.currentUser = $scope.currentUser = data;
        $rootScope.currentUser.isLeader = ($scope.currentUser.team && $scope.currentUser.team.role == 'admin');
        getCurrentUserPlan();
    });

    $rootScope.$on("Team.Update", function(event, data) {
        $scope.currentTeam = $rootScope.currentTeam = data;
    });

    function setPurchase(){
        $scope.purchase = {};
    };
    setPurchase();

    $scope.archiveProject = function(project) {
        project.archive = true;
        projectService.updateProject({id: project._id}, project).$promise.then(function(res) {
            $scope.showToast("Archive project successfully!");
            $rootScope.$emit("Project.Archive", res);
            var index = _.findIndex($scope.projects, function(item) {
                return item._id == project._id;
            });
            $scope.projects.splice(index, 1);
            $scope.totalProject -= 1;
            var maximumCreatedProject;
            switch ($rootScope.purchaseType) {
                case "small":
                    maximumCreatedProject = 5;
                break;
                case "medium":
                    maximumCreatedProject = 10;
                break;
                case "large":
                    maximumCreatedProject = 15;
                break;
                default:
                    console.log("There Has Been An Error...");
                break;
            }
            if ($scope.totalProject === maximumCreatedProject) {
                $mdDialog.cancel();
                userService.getCurrentStipeCustomer({plan: $rootScope.purchaseType}).$promise.then(function(res) {
                    if (!res._id) {
                        handler.open($scope.plans[$rootScope.purchaseType]);
                    } else {
                        $scope.showToast("Change Plan Successfully");
                        $rootScope.$emit("User.Update", res);
                    }
                }, function(err) {$scope.showToast("Error");});
            }
        }, function(err) {
            $scope.showToast("There Has Been An Error...");
        });
    };

    $scope.showModalPayment = function($event, type) {
        var title = "Do you want to ";
        var content = "You can create ";
        if (type==="small") {
            content += "5 open projects with $45/month";
        } else if (type==="medium") {
            content += "10 open projects with $80/month";
        } else if (type==="large") {
            content += "15 open projects with $105/month";
        }
        if ($scope.currentUser.noPlan) {
            title += "buy " + type + " plan ?";
        } else {
            title += "change to " + type + " plan ?";
        }
        var confirm = $mdDialog.confirm().title(title).textContent(content).ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $rootScope.purchaseType = type;
            if (type === "small" && $scope.totalProject > 5) {
                $mdDialog.show({
                    targetEvent: $event,
                    controller: 'settingsCtrl',
                    templateUrl: 'app/modules/settings/partials/projects-list-modal.html',
                    resolve: {
                        currentUser: ["authService", function(authService) {
                            return authService.getCurrentUser().$promise;
                        }]
                    },
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            } else if (type === "medium" && $scope.totalProject > 10) {
                $mdDialog.show({
                    targetEvent: $event,
                    controller: 'settingsCtrl',
                    templateUrl: 'app/modules/settings/partials/projects-list-modal.html',
                    resolve: {
                        currentUser: ["authService", function(authService) {
                            return authService.getCurrentUser().$promise;
                        }]
                    },
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            } else {
                userService.getCurrentStipeCustomer({plan: type}).$promise.then(function(res) {
                    if (!res._id) {
                        handler.open($scope.plans[type]);
                    } else {
                        $scope.showToast("Change Plan Successfully");
                        $rootScope.$emit("User.Update", res);
                    }
                }, function(err) {$scope.showToast("Error");});
            }
        }, function() {
            
        });
    };
    if ($rootScope.purchaseType) {
        $scope.purchaseType = $rootScope.purchaseType;
    }

    $scope.buyPlan = function(form) {
        var currentDate = new Date();
        if (form.$valid) {
            if ($scope.purchase.exp_month.length > 2 && ($scope.purchase.exp_month < 1 || $scope.purchase.exp_month > 12)) {
                $scope.showToast("Please check your expiration month");
                return false;
            } else if ($scope.purchase.exp_year.length > 4) {
                $scope.showToast("Please check your expiration year");
                return false;
            }
            stripe.card.createToken($scope.purchase).then(function(res) {
                $scope.purchase.purchaseType = $rootScope.purchaseType;
                $scope.purchase.token = res.id;
                $scope.purchase.cardLast4 = res.card.last4;
                userService.buyPlan({id:$scope.currentUser._id}, $scope.purchase).$promise.then(function(res) {
                    $scope.cancelDialog();
                    $scope.showToast("Purchase successfully");
                    $rootScope.$emit("User.Update", res);
                }, function(err) {$scope.showToast("There Has Been An Error...");});
            });
        } else {
            $scope.showToast("Please check your input");
            return;
        }
    };

    $scope.member = {
      emails : []
    };
    $scope.team = {
        emails: []
    };

    $scope.addNewTagFileText = "+ Add Another";
    $scope.addNewTagDocumentText = "+ Add Another";
    $scope.addNewTagVersionText = "+ Add Another";

    $scope.newTag = {};
    $scope.isEditTags = false;
    $scope.addNewTag = function(newTag, type) {
        if (type === "file") {
            if (newTag !== "{{addNewTagFileText}}") {
                $scope.currentTeam.fileTags.push(newTag);
                $scope.newTag.file = null;
                $scope.isEditTags = true;
            } else {
                $scope.showToast("Please check your tag again");
            }
        } else if (type === "document") {
            if (newTag !== "{{addNewTagDocumentText}}") {
                $scope.currentTeam.documentTags.push(newTag);
                $scope.newTag.document = null;
                $scope.isEditTags = true;
            } else {
                $scope.showToast("Please check your tag again");
            }
        } else if (type==="version") {
            if (newTag !== "{{addNewTagVersionText}}") {
                $scope.currentTeam.versionTags.push(newTag);
                $scope.newTag.version = null;
                $scope.isEditTags = true;
            } else {
                $scope.showToast("Please check your tag again");
            }
        }
    };

    $scope.removeTag = function(index, type) {
        if (type === "file") {
            $scope.currentTeam.fileTags.splice(index,1);
        } else if (type === "document") {
            $scope.currentTeam.documentTags.splice(index,1);
        } else if (type==="version") {
            $scope.currentTeam.versionTags.splice(index,1);
        }
        $scope.isEditTags = true;
    };
    
    function getTeamLeader(team) {
        $scope.currentUser.isleader = false;
        if (_.findIndex(team.leader, function(user) {
            return user._id == $scope.currentUser._id;
        }) != -1) {
            $scope.currentUser.isLeader = true;
        }
    };

    $scope.saveChangedTags = function() {
        $scope.currentTeam.editType = "change-tags";
        teamService.update({id: $scope.currentTeam._id}, $scope.currentTeam).$promise.then(function(res) {
            $scope.isEditTags = false;
            $scope.cancelDialog();
            $scope.showToast("Your Custom Tags Have Been Updated.");
			
			//Track Custom Tags Update
			mixpanel.identify($rootScope.currentUser._id);
			mixpanel.track("Custom Tags Updated");
			
            $rootScope.$emit("Team.Update", res);
        }, function(err){$scope.showToast(err.data);});
    };

    $scope.showModalCreateTeam = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/create-team.html',
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.showAddNewStaffMemberModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-staff-addNew.html',
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.showAddCCModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-billing-newCC.html',
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.showEditBillingModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-billing-editBilling.html',
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.cancelDialog = function() {
        $mdDialog.cancel();
    };

    $scope.getTeamType = function(type) {
        if (type == "homeOwner") {
            $scope.team.name = $scope.currentUser.name;
        } else {
            $scope.team.name = '';
        }
    };

    $scope.createTeam = function(form) {
        if (form.$valid) {
            teamService.create($scope.team, function (team) {
                $rootScope.currentTeam = $scope.currentTeam = team;
                getTeamLeader($scope.currentTeam);
                $rootScope.$emit('TeamUpdate',team);
                $scope.cancelDialog();
                $scope.showToast("You Have Successfully Created Your Team.");
				
				//Track Team Creation
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Team Created");
				
                $state.go('settings.staff', {},{reload: true}).then(function(data){});
            }, function (err) {
                $scope.cancelDialog();
                $scope.showToast("There Has Been An Error...");
            });
        }
    };
	
    $scope.showEditCompanyModal = function($event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-company-edit.html',
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.saveDetail = function(form) {
        if (!$scope.currentTeam._id) {
            $scope.showToast("You Are Not Yet a Part of a Team...");
            return;
        } else if (form.$valid) {
            $scope.currentTeam.editType = "editCompanyDetail";
            teamService.update({_id : $scope.currentTeam._id},$scope.currentTeam).$promise
            .then(function(team) {
				$mdDialog.hide();
                $scope.showToast("Company Details Have Been Successfully Updated.");
                $rootScope.$emit('Team.Update',team);
				
				//Track Company Update
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Company Details Updated");
				
            }, function(err) {
                $scope.showToast("There Has Been An Error...");
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
            $scope.showToast("Your Team Members Have Been Added Successfully.");
            $scope.currentTeam = team;
            $rootScope.$emit('TeamUpdate',team);
			
			//Track Addition of Members
			mixpanel.identify($rootScope.currentUser._id);
			mixpanel.track("Member Added to Team");
			
            $scope.member.emails = [];
			$mdDialog.hide();
        }, function(err){
            $scope.showToast("There Has Been An Error...");
        });
    };

    $scope.removeMember = function(member){
        var confirm = $mdDialog.confirm().title("Do you want to remove this user from your team?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.removeMember({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
                $scope.showToast("Team Member Has Been Removed Successfully.");
                $scope.currentTeam = team;
                $rootScope.$emit('TeamUpdate',team);
            }, function (err) {
                $scope.showToast("There Has Been An Error...");
            });
        }, function() {
            
        });
    };

    $scope.assignLeader = function(member) {
        var confirm = $mdDialog.confirm().title("Do you want to assign this user as a team administrator?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.assignLeader({id: $scope.currentTeam._id}, member).$promise
            .then(function (team) {
                $scope.currentTeam = team;
                $scope.showToast("You Have Successfully Assigned " + member._id.name + " as a Team Administrator");
                $rootScope.$emit('TeamUpdate',team);
            }, function(err) {
                $scope.showToast("There Has Been An Error...");
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
                $scope.showToast("There Has Been An Error...");
            });
        }, function() {
            
        });
    };

    

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.submitCreditCard = function(form) {
        if (form.$valid) {
            $scope.currentUser.editType = "enterCreditCard";
            userService.changeProfile({id: $scope.currentUser._id}, $scope.currentUser).$promise.then(function(res) {
                $mdDialog.hide();
                $scope.showToast("Submit credit card successfully");
                $rootScope.$emit("User.Update", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        } else {
            $scope.showToast("Please check your input again");
        }
    };

    $scope.editBillingAddress = function(form) {
        if (form.$valid) {
            teamService.update({id: $scope.currentTeam._id}, $scope.currentTeam).$promise.then(function(res) {
                $mdDialog.hide();
                $scope.showToast("Update billing address successfully");
                $rootScope.$emit("Team.Update", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        } else {
            $scope.showToast("Please check your input again");
        }
    };

    $scope.showModal = function($event, name, type) {
        $rootScope.editUserType = type;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/'+name,
            resolve: {
                currentUser: ["authService", function(authService) {
                    return authService.getCurrentUser().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };
    $scope.editUserType = ($rootScope.editUserType) ? $rootScope.editUserType : null;
    $scope.editUserInfo = function(form) {
        if (form.$valid) {
            if ($scope.editUserType === "phoneNumber") {
                authService.changeProfile($scope.currentUser.firstName, $scope.currentUser.lastName, $scope.currentUser.phoneNumber)
                .then(function(data){
                    $scope.cancelDialog();
                    $scope.showToast("Phone Number Updated Successfully.");
                    $rootScope.$emit('Profile.change',data);
					
					//Track Phone Number Update
					mixpanel.identify($rootScope.currentUser._id);
					mixpanel.track("Phone Number Updated");
					
                }, function(err){$scope.showToast("There Has Been An Error...");});
            } else if ($scope.editUserType === "password") {
                if ($scope.currentUser.newPassword.length < 6) {
                    $scope.showToast("Please enter password at least 6 characters");
                    return;
                }
                if ($scope.currentUser.newPassword !== $scope.currentUser.retypePassword) {
                    $scope.showToast("New password and re-type password not match");
                    return;
                }
                authService.changePassword($scope.currentUser.oldPassword,$scope.currentUser.newPassword).then(function(res) {
                    $scope.cancelDialog();
                    $scope.showToast("Your password has been changed");
                    }, function(err) {$scope.showToast("There Has Been An Error...");});
            } else {
                if ($scope.email !== $scope.currentUser.email) {
                    authService.changeEmail($scope.email).then(function() {
                        $scope.cancelDialog();
                        $scope.showToast("An email has been sent to your email to confirm your change");
                    }, function(err) {
                        $scope.showToast("There Has Been An Error...");
                    });
                } else {
                    $scope.showToast("Please check your input again");
                    return;
                }
            }   
        } else {
            $scope.showToast("Please check your input");
        }
    };

    $scope.acceptJoinRequest = function(member) {
        var confirm = $mdDialog.confirm().title("Do you want to accept this request?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            teamService.acceptJoinRequest({id: $scope.currentTeam._id, memberId: member._id._id}).$promise.then(function(res) {
                $scope.showToast("Successfully");
                $rootScope.currentTeam = $scope.currentTeam = res;
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }, function(){});
    };
    
    getTeamLeader($scope.currentTeam);

});