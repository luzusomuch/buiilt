angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, people, activityService) {
    $scope.dialogService = dialogService;
    $scope.firstDayOfWeek = 0;

    $scope.selectedDate = null;
    $scope.dayFormat = "d";
    $scope.tooltips = true;

    $scope.activity = {
        isMilestone: false
    };

    $scope.dayClick = function(date) {
        console.log("You clicked " + date);
    };

    $scope.prevMonth = function(data) {
        console.log("You clicked (prev) month " + data.month + ", " + data.year);
    };

    $scope.nextMonth = function(data) {
        console.log("You clicked (next) month " + data.month + ", " + data.year);
    };

    var holidays = {"2016-04-01": [{"name": "AAAAAAA"}], "2016-04-07": [{name: "BBBBBBB"}]};
    // You would inject any HTML you wanted for
    // that particular date here.
    var numFmt = function(num) {
        num = num.toString();
        if (num.length < 2) {
            num = "0" + num;
        }
        return num;
    };

    var loadContentAsync = true;
    $scope.setDayContent = function(date) {
        var key = [date.getFullYear(), numFmt(date.getMonth()+1), numFmt(date.getDate())].join("-");
        var data = (holidays[key]||[{ name: ""}])[0].name;
        if (loadContentAsync) {
            var deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(data);
            });
            return deferred.promise;
        }
        return data;
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
    };
    getProjectMembers();

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectCalendarCtrl',
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-calendar/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Select member for adding to new milestone or activity*/
    $scope.selectItem = function(index, type) {
        if (type === "member")
            $scope.membersList[index].select = !$scope.membersList[index].select;
    };

    /*function to check if activity has valid date for estimated and actual date time*/
    function checkValidActualAndEstimateDateTime(estimated, actual) {
        /*return true when not valid and false when valid*/
        if (estimated && actual) {
            var error = true;
            if (estimated.date.start && moment(estimated.date.start).isValid())
                error = false;
            if (estimated.date.end && moment(estimated.date.end).isValid()) 
                error = false;
            if (actual.date.end && moment(actual.date.end).isValid()) 
                error = false;
            if (actual.date.end && moment(actual.date.end).isValid()) 
                error = false;
            if (estimated.time.start && moment(moment(estimated.time.start, "hh:mm"), "hh:mm").isValid())
                error = false
            if (estimated.time.end && moment(moment(estimated.time.end, "hh:mm"), "hh:mm").isValid())
                error = false
            if (actual.time.start && moment(moment(actual.time.start, "hh:mm"), "hh:mm").isValid())
                error = false
            if (actual.time.end && moment(moment(actual.time.end, "hh:mm"), "hh:mm").isValid())
                error = false
            return error;
        } else {
            return true;
        }
    };

    /*Create new activity or milestone*/
    $scope.createActivityOrMilestone = function(form) {
        console.log($scope.activity);
        if (form.$valid) {
            $scope.activity.newMembers = _.filter($scope.membersList, {select: true});
            var error = false;
            if (!$scope.activity.isMilestone) {
                error = checkValidActualAndEstimateDateTime($scope.activity.estimated, $scope.activity.actual);
            } else if ($scope.activity.newMembers.length === 0) {
                dialogService.showToast("Please select at least 1 member");
                error = true;
            }

            if (error) {
                dialogService.showToast("Check your input again.");
            } else
                activityService.create({id: $stateParams.id}, $scope.activity).$promise.then(function(res) {
                    dialogService.showToast("Success");
                    dialogService.closeModal();
                }, function(err) {dialogService.showToast("Error");});
        } else {
            dialogService.showToast("Check your input again.");
        }
    };
});