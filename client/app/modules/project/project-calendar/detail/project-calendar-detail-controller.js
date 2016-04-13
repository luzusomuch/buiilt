angular.module("buiiltApp").controller("projectCalendarDetailCtrl", function($rootScope, $scope, $stateParams, dialogService, activityService, activity, activities, people, $mdDialog) {
    $rootScope.title = activity.name + "'s Detail";
    $scope.activity = activity;
    $scope.activity.isAddNew = false;
    $scope.dialogService = dialogService;

    $scope.newActivity = {
        dependencies: [],
        isDependent: false,
        isMilestone: $rootScope.isMilestone,
        isBelongToMilestone: true
    };

    /*Get all project members*/
    function getProjectMembers() {
        $scope.membersList = [];
        _.each($rootScope.roles, function(role) {
            _.each(people[role], function(tender){
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
                                    member.select = false;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            $scope.membersList.push(tender.tenderers[0]._id);
                        } else {
                            $scope.membersList.push({email: tender.tenderers[0].email, select: false});
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        // get unique member 
        $scope.membersList = _.uniq($scope.membersList, "_id");

        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});

        // get not assigned people for current activity or milestone
        $scope.assignees = angular.copy($scope.membersList);
        _.each($scope.activity.members, function(member) {
            var index = _.findIndex($scope.assignees, function(assignee) {
                return assignee._id == member._id;
            });
            if (index !== -1) {
                $scope.assignees.splice(index, 1);
            }
        });
        _.each($scope.activity.notMembers, function(notMember) {
            var index = _.findIndex($scope.assignees, function(assignee) {
                return assignee.email === notMember;
            });
            if (index !== -1) {
                $scope.assignees.splice(index, 1);
            }
        });

        $scope.availableActivities = _.filter(activities, {isMilestone: false});
        if ($scope.activity.isMilestone) {
            _.each($scope.activity.subActivities, function(act) {
                var index = _.findIndex($scope.availableActivities, function(activity) {
                    return activity._id = act;
                });
                if (index !== -1) {
                    $scope.availableActivities.splice(index, 1);
                }
            });
        }

    };
    getProjectMembers();

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
        if (modalName === "add-activity-to-milestone.html" && !activity.isMilestone) {
            dialogService.showToast("Not Allow");
            return;
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectCalendarDetailCtrl',
            templateUrl: 'app/modules/project/project-calendar/partials/' + modalName,
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                activity: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.get({id: $stateParams.activityId}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.selectItem = function(index, type) {
        if (type === "assignee") {
            $scope.assignees[index].select = !$scope.assignees[index].select;
        } else if (type === "activity") {
            $scope.availableActivities[index].select = !$scope.availableActivities[index].select;
        } else if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        }
    };

    /*assign project member to current activity or milestone*/
    $scope.assignPeople = function() {
        $scope.activity.newMembers = _.filter($scope.assignees, {select: true});
        if ($scope.activity.newMembers.length > 0) {
            $scope.activity.editType = "assign-people";
            $scope.update($scope.activity);
        } else {
            dialogService.showToast("Please select at least 1 members");
        }
    };

    /*Update start date, end date and duration when changed one*/
    $scope.getChangeValue = function(type) {
        if ($scope.newActivity.date.start && type === "du") {
            $scope.newActivity.date.end = new Date(moment($scope.newActivity.date.start).add($scope.newActivity.date.duration, "days"));
        } else if ($scope.newActivity.date.end && type==="du") {
            $scope.newActivity.date.start = new Date(moment($scope.newActivity.date.end).add($scope.newActivity.date.duration, "days"));
        } else if ((type === "st"||type==="et") && $scope.newActivity.date.end) {
            $scope.newActivity.date.duration = moment(moment($scope.newActivity.date.end)).diff(moment($scope.newActivity.date.start), 'days');
        }

        if ($scope.newActivity.date) {
            if (moment(moment($scope.newActivity.date.start).format("YYYY-MM-DD")).isAfter(moment($scope.newActivity.date.end).format("YYYY-MM-DD")))
                $scope.dateError = "End Date Must Greator Than Stat Date";
            else if ($scope.newActivity.duration && $scope.newActivity.duration <= 0) 
                $scope.dateError = "Duration Must Greator Than 0";
            else
                $scope.dateError = null;
        }
    };

    /*Insert new activity into current milestone or insert existed activities into milestone*/
    $scope.submitActivity = function() {
        if ($scope.activity.isAddNew) {
            var error = false;
            var timeError = false;
            $scope.newActivity.selectedMilestone = $stateParams.activityId;
            $scope.newActivity.newMembers = _.filter($scope.membersList, {select: true});
            if (!$scope.newActivity.name || $scope.newActivity.name.trim().length === 0) {
                dialogService.showToast("Activity name is required");
                return;
            }
            if ($scope.newActivity.newMembers.length === 0) {
                dialogService.showToast("Please Select At Least 1 Member");
                error = true;
            }
            if ($scope.newActivity.date) {
                if (moment(moment($scope.newActivity.date.start).format("YYYY-MM-DD")).isSameOrBefore(moment($scope.newActivity.date.end).format("YYYY-MM-DD")))
                    error = false;
            } else
                error = true;
            if ($scope.newActivity.time) {
                if (!$scope.newActivity.time.start || !$scope.newActivity.time.end) 
                    timeError = true;
            } else
                timeError = true;

            if (!error && !timeError) {
                activityService.create({id: $stateParams.id}, $scope.newActivity).$promise.then(function(res) {
                    dialogService.showToast("Inserted New Activity Into Milestone Successfully");
                    dialogService.closeModal();
                    $scope.activity.subActivities.push(res);
                }, function(err) {dialogService.showToast("Error");});
            } else {
                dialogService.showToast("Please Check Your Input");
            }
        } else {
            $scope.activity.newActivities = _.filter($scope.availableActivities, {select: true});
            if ($scope.activity.newActivities.length === 0) {
                dialogService.showToast("Select At Least 1 activity");
            } else {
                $scope.activity.editType = "insert-activities";
                $scope.update($scope.activity);
            }
        }
    };

    /*update current activity or milestone base on editType*/
    $scope.update = function(activity) {
        activityService.update({id: activity._id}, activity).$promise.then(function(res) {
            if (activity.editType==="assign-people") {
                dialogService.showToast("Assign more people successfully!");
            } else if (activity.editType==="insert-activities") {
                dialogService.showToast("Inserted Activities Successfully");
            }
            dialogService.closeModal();
        }, function(err) {dialogService.showToast("Error");});
    };
});