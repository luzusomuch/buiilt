angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $mdToast, $stateParams, peopleService, people) {
	$scope.project = $rootScope.project;
    $scope.people = people;
    $rootScope.title = "Tenders list";

    // filter section
    $scope.name = null;
    $scope.invitee = null;
    $scope.weekTags = [{text: "this week", value: "this"}, {text: "next week", value: "next"}];
    $scope.statusTags = [{text: "to be distributed", value: false}, {text: "distributed", value: true}];
    $scope.selectedStatus = [];
    $scope.selectedWeek = [];

    $scope.selectDueDate = function(dueDate) {
        $scope.dueDate = dueDate;
        $scope.selectedStatus = [];
        $scope.selectedWeek = [];
        _.each($scope.statusTags, function(status) {
            status.select = false;
        });
        _.each($scope.weekTags, function(week) {
            week.select = false;
        });
    };

    $scope.selectTag = function(index, type) {
        $scope.dueDate = null;
        if (type === "status") {
            _.each($scope.weekTags, function(week) {
                week.select = false;
            });
            $scope.selectedWeek = [];
            $scope.statusTags[index].select = !$scope.statusTags[index].select;
            if ($scope.statusTags[index].select) {
                $scope.selectedStatus.push($scope.statusTags[index].value);
            } else {
                $scope.selectedStatus.splice(_.indexOf($scope.selectedStatus, $scope.statusTags[index].value), 1);
            }
        } else {
            _.each($scope.statusTags, function(status) {
                status.select = false;
            });
            $scope.selectedStatus = [];
            $scope.weekTags[index].select = !$scope.weekTags[index].select;
            if ($scope.weekTags[index].select) {
                $scope.selectedWeek.push($scope.weekTags[index].value);
            } else {
                $scope.selectedWeek.splice(_.indexOf($scope.selectedWeek, $scope.weekTags[index].value), 1);
            }
        }
    };

    $scope.search = function(tender) {
        var found = false;
        if ($scope.name && $scope.name.length > 0) {
            if (tender.tenderName && (tender.tenderName.toLowerCase().indexOf($scope.name) > -1 || tender.tenderName.indexOf($scope.name) > -1)) {
                found = true;
            }
            return found;
        } else if ($scope.invitee && $scope.invitee.length > 0) {
            if (tender.tenderers.length > 0) {
                _.each(tender.tenderers, function(tenderer) {
                    if ((tenderer.name && (tenderer.name.toLowerCase().indexOf($scope.invitee) > -1 || tenderer.name.indexOf($scope.invitee) > -1)) || (tenderer.email && tenderer.email.toLowerCase().indexOf($scope.invitee) > -1)) {
                        found = true;
                    }
                });
            }
            return found;
        } else if ($scope.selectedStatus && $scope.selectedStatus.length > 0) {
            _.each($scope.selectedStatus, function(status) {
                if (tender.isDistribute === status) {
                    found = true;
                }
            });
            return found;
        } else if ($scope.dateEnd) {
            if (moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(moment(tender.dateEnd).format("YYYY-MM-DD"))) {
                found = true;
            }
            return found;
        } else if ($scope.selectedWeek && $scope.selectedWeek.length > 0) {
            var thisWeekStartDate, thisWeekEndDate, nextWeekStartDate, nextWeekEndDay;
            var tenderDateEnd = moment(tender.dateEnd).format("YYYY-MM-DD");
            _.each($scope.selectedWeek, function(week) {
                if (week === "this") {
                    thisWeekStartDate = moment().startOf('week').format("YYYY-MM-DD");
                    thisWeekEndDate = moment().endOf('week').format("YYYY-MM-DD");
                    if (moment(tenderDateEnd).isSameOrAfter(thisWeekStartDate) && moment(tenderDateEnd).isSameOrBefore(thisWeekEndDate)) {
                        found = true;
                    }
                } else {
                    nextWeekStartDate = moment().startOf("week").add(7, "days").format("YYYY-MM-DD");
                    nextWeekEndDay = moment().endOf("week").add(7, "days").format("YYYY-MM-DD");
                    if (moment(tenderDateEnd).isSameOrAfter(nextWeekStartDate) && moment(tenderDateEnd).isSameOrBefore(nextWeekEndDay)) {
                        found = true;
                    }
                }
            });
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
                if (tender.inviter._id == $rootScope.currentUser._id || _.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id == $rootScope.currentUser._id;
                    }
                }) !== -1) {
                    $scope.allowInviteTender = true;
                }
                
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
                        tenderers: tender.tenderers,
                        isDistribute: tender.isDistribute,
                        dateEnd: tender.dateEnd
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
                            $scope.showToast("Tender Has Been Created Successfully.");
                            $scope.cancelNewTenderModal();
                            $rootScope.$broadcast("Tender.Inserted", res);
                        }, function(res){
                            $scope.showToast("There Has Been An Error...")
                        });
                    } else {
                        $scope.showToast("There Has Been An Error...");
                        return;
                    }
                };

                $scope.showToast = function(value) {
                    $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
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