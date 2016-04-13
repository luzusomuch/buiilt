angular.module("buiiltApp").controller("projectCalendarDetailCtrl", function($rootScope, $scope, dialogService, activityService, activity, activities, people, $mdDialog) {
    $rootScope.title = activity.name + "'s Detail";
    $scope.activity = activity;
    $scope.dialogService = dialogService;

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
    };
    getProjectMembers();

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
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

    /*update current activity or milestone base on editType*/
    $scope.update = function(activity) {
        activityService.update({id: activity._id}, activity).$promise.then(function(res) {
            if (activity.editType==="assign-people") {
                dialogService.showToast("Assign more people successfully!");
            }
            dialogService.closeModal();
        }, function(err) {dialogService.showToast("Error");});
    };
});