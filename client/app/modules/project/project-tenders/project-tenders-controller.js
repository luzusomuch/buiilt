angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $mdToast, $stateParams, peopleService, people) {
	$scope.project = $rootScope.project;
    $scope.people = people;
    $rootScope.title = "Tenders list";

    // filter section
    $scope.name = null;
    $scope.invitee = null;
    $scope.weekTags = [{text: "this week", value: "this"}, {text: "next week", value: "next"}];
    $scope.statusTags = [{text: "to be distributed", value: "distribute"}, {text: "distributed", value: "distributed"}];

    $scope.selectDueDate = function(dueDate) {
        console.log(dueDate);
    };

    $scope.search = function(tender) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (tender.tenderName.toLowerCase().indexOf($scope.name) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.invitee && $scope.invitee.length > 0) {
            var found = false;
            if (tender.tenderers.length > 0) {
                _.each(tender.tenderers, function(tenderer) {
                    if (tenderer.name.toLowerCase().indexOf($scope.invitee) > -1 || tenderer.email.toLowerCase().indexOf($scope.invitee) > -1) {
                        found = true;
                    }
                });
            }
            return found;
        } else {
            return true;
        }
    };
    // end filter section

    function getTenderersList(people) {
        $scope.membersList = [];
        _.each($rootScope.roles, function(role) {
            _.each(people[role], function(tender) {
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
    }

    getTenderersList($scope.people);

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

	//Functions to handle New Tender Dialog.
	$scope.showNewTenderModal = function() {
        $mdDialog.show({
            // targetEvent: $event,
            controller: function($scope, $rootScope, peopleService) {
                $scope.minDate = new Date();
                $scope.cancelNewTenderModal = function () {
                    $mdDialog.cancel();
                    $mdDialog.cancel();
                };
                if ($rootScope.currentInviteData) {
                    $scope.invite = $rootScope.invite = $rootScope.currentInviteData;
                }
                peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res) {
                    $scope.people = res;
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
                        });
                    });
                    switch($rootScope.currentUser.type) {
                        case "builders":
                            $scope.availableUserType = [
                                {value: 'addSubcontractor', text: 'Subcontractor'},
                                {value: 'addConsultant', text: 'Consultant'}
                            ];
                            break;
                        case "architects": 
                            $scope.availableUserType = [
                                {value: 'addBuilder', text: 'Builder'},
                                {value: 'addConsultant', text: 'Consultant'}
                            ];
                            break;
                        default:
                            break;
                    }
                });

                // function getCurrentTeamMember() {
                //     //get current user logged in team member
                //     $scope.teamMembersCanInvite = $rootScope.currentTeam.leader;
                //     _.each($rootScope.currentTeam.member, function(member) {
                //         if (member._id && member.status === "Active") {
                //             $scope.teamMembersCanInvite.push(member._id);
                //         }
                //     });
                //     $scope.teamMembersCanInvite = _.uniq($scope.teamMembersCanInvite, '_id');
                //     _.remove($scope.teamMembersCanInvite, {_id: $rootScope.currentUser._id});

                //     if ($scope.people[$rootScope.currentUser.type]) {
                //         _.each($scope.people[$rootScope.currentUser.type], function(tender) {
                //             var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                //                 if (tenderer._id) {
                //                     return tenderer._id._id == $rootScope.currentUser._id;
                //                 }
                //             });
                //             if (currentTendererIndex !== -1) {
                //                 var currentTenderer = tender.tenderers[currentTendererIndex];
                //                 _.each(currentTenderer.teamMember, function(member) {
                //                     _.remove($scope.teamMembersCanInvite, {_id: member._id});
                //                 });
                //             }
                //         });
                //     }
                // };

                // $scope.getChangeTypeValue = function(type) {
                //     if (type === 'addClient' || type === "addEmployee") {
                //         $scope.invite.isTender = false;
                //         if (type == 'addEmployee') {
                //             getCurrentTeamMember();
                //             $scope.invite.isInviteTeamMember = true;
                //         } else {
                //             $scope.invite.isInviteTeamMember = false;
                //         }
                //     } else {
                //         $scope.invite.isTender = true;
                //         $scope.invite.isInviteTeamMember = false;
                //     }
                //     $scope.invite.teamMember = [];
                //     $scope.invite.invitees = [];
                // };

                // $scope.addInvitee = function(email, name) {
                //     if (email && email != '' && name && name != '') {
                //         if (_.findIndex($scope.invite.invitees, {email: email}) === -1) {
                //             $scope.invite.invitees.push({email: email, name: name});
                //             $scope.email = null;
                //             $scope.name = null;
                //         } else {
                //             $scope.showToast("This email has already added");
                //         }
                //     }
                // };  

                // $scope.removeInvitee = function(index) {
                //     $scope.invite.invitees.splice(index, 1);
                // };

                $scope.pickFile = pickFile;

                $scope.onSuccess = onSuccess;

                function pickFile(){
                    filepickerService.pick(
                        onSuccess
                    );
                };

                function onSuccess(file, type){
                    file.type = "file";
                    $scope.invite.file = file;
                };

                $scope.inviteNewTeamMember = function(form) {
                    if (form.$valid && $scope.invite.type) {
                        $scope.invite.inviterType = $rootScope.currentUser.type;
                        $scope.invite.isTender = true;
                        $scope.invite.invitees = [];
                        peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
                            $scope.showToast("Create tender successfully!");
                            $scope.cancelNewTenderModal();
                            $rootScope.$broadcast("Tender.Inserted", res);
                        }, function(res){
                            $scope.showToast("Error. Something went wrong.")
                        });
                    } else {
                        $scope.showToast("Please check input again");
                        return;
                    }
                };

                $scope.showToast = function(value) {
                    $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
                };
            },
            templateUrl: 'app/modules/project/project-tenders/new/project-tenders-new.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
	};
	
	$scope.tendersFilters = ['Tender 1', 'Tender 2'];

    if ($rootScope.currentInviteData) {
        $scope.showNewTenderModal();
        $timeout(function() {
            $rootScope.currentInviteData = null;
        },300);
    }
    $rootScope.$on("Tender.Inserted", function(event, data) {
        getTenderersList(data);
    });
});