angular.module('buiiltApp').controller('settingsCtrl', function($rootScope, $scope, $timeout, $state, teamService, $mdToast, $mdDialog, authService, userService, stripe) {
    $rootScope.title = "Settings"
    $scope.currentTeam = $rootScope.currentTeam;
    $scope.currentUser = $rootScope.currentUser;
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
    $rootScope.$on("User.Update", function(event, data) {
        $scope.currentUser = $rootScope.currentUser = data;
        $rootScope.currentUser.isLeader = ($scope.currentUser.team.role == 'admin');
        getCurrentUserPlan();
    });

    $rootScope.$on("Team.Update", function(event, data) {
        $scope.currentTeam = $rootScope.currentTeam = data;
    });

    function setPurchase(){
        $scope.purchase = {};
    };
    setPurchase();

    $scope.showModalPayment = function($event, type) {
        $rootScope.purchaseType = type;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/payment.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
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
                    $rootScope.$broadcast("User.Update", res);
                }, function(err) {$scope.showToast(err.data);});
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

    $scope.newTag = {};
    $scope.isEditTags = false;
    $scope.addNewTag = function(newTag, type) {
        if (type === "file") {
            if (newTag.file !== "{{addNewTagFileText}}") {
                $scope.currentTeam.fileTags.push(newTag);
                $scope.newTag.file = null;
                $scope.isEditTags = true;
            } else {
                $scope.showToast("Please check your tag again");
            }
        } else if (type === "document") {
            if (newTag.document !== "{{addNewTagDocumentText}}") {
                $scope.currentTeam.documentTags.push(newTag);
                $scope.newTag.document = null;
                $scope.isEditTags = true;
            } else {
                $scope.showToast("Please check your tag again");
            }
        }
    };

    $scope.removeTag = function(index, type) {
        if (type === "file") {
            $scope.currentTeam.fileTags.splice(index);
        } else if (type === "document") {
            $scope.currentTeam.documentTags.splice(index);
        }
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
            $scope.showToast("Changed tags successfully");
            $rootScope.$broadcast("Team.Update", res);
        }, function(err){$scope.showToast(err.data);});
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
	
    $scope.showAddCCModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-billing-newCC.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.showEditBillingModal = function($event) {
		
        $mdDialog.show({
            targetEvent: $event,
            controller: 'settingsCtrl',
            templateUrl: 'app/modules/settings/partials/settings-billing-editBilling.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
		
    };
	
    $scope.cancelDialog = function() {
        $mdDialog.cancel();
    };

    $scope.getTeamType = function(type) {
        if (type == "homeOwner") {
            $scope.team.name = $scope.currentUser.lastName;
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
                $scope.showToast("Create new team successfully!");
                $state.go('settings.staff', {},{reload: true}).then(function(data){
                });
            }, function (err) {
                $scope.cancelDialog();
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
        if (!$scope.currentTeam._id) {
            $scope.showToast("You haven\'t created or joined any team");
            return;
        } else if (form.$valid) {
            $scope.currentTeam.editType = "editCompanyDetail";
            teamService.update({_id : $scope.currentTeam._id},$scope.currentTeam).$promise
            .then(function(team) {
				$mdDialog.hide();
                $scope.showToast("Company details have updated successfully!");
                $rootScope.$emit('Team.Update',team);
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

    

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.submitCreditCard = function(form) {
        if (form.$valid) {
            $scope.currentUser.editType = "enterCreditCard";
            userService.changeProfile({id: $scope.currentUser._id}, $scope.currentUser).$promise.then(function(res) {
                $mdDialog.hide();
                $scope.showToast("Submit credit card successfully");
                $rootScope.$broadcast("User.Update", res);
            }, function(err) {$scope.showToast(err.message);});
        } else {
            $scope.showToast("Please check your input again");
        }
    };

    $scope.editBillingAddress = function(form) {
        if (form.$valid) {
            teamService.update({id: $scope.currentTeam._id}, $scope.currentTeam).$promise.then(function(res) {
                $mdDialog.hide();
                $scope.showToast("Update billing address successfully");
                $rootScope.$broadcast("Team.Update", res);
            }, function(err) {$scope.showToast(err.message);});
        } else {
            $scope.showToast("Please check your input again");
        }
    };

    getTeamLeader($scope.currentTeam);

});