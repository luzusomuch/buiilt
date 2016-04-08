angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, activityService, people, activities, tasks) {
    $scope.dialogService = dialogService;
    $scope.firstDayOfWeek = 0;

    $scope.selectedDate = null;
    $scope.dayFormat = "d";
    $scope.tooltips = true;

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

    function convertAllToCalendarView() {
        $scope.activities = activities;
        var allData = _.union(activities, tasks);
        _.each(allData, function(data) {
            if (data.element && data.element.type === "task-project") {}
        })
    };
    convertAllToCalendarView();

    $scope.activity = {
        dependencies: [],
        isDependent: false,
        isMilestone: $rootScope.isMilestone
    };

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
        if (modalName === "create-activity.html") 
            $rootScope.isMilestone = false;
        else if (modalName === "create-milestone.html") 
            $rootScope.isMilestone = true;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectCalendarCtrl',
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }],
                tasks: ["taskService", "$stateParams", function(taskService, $stateParams) {
                    return taskService.getProjectTask({id: $stateParams.id}).$promise;
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
    function checkValidActualAndEstimateDateTime(date, time) {
        /*return true when not valid and false when valid*/
        if (date && time) {
            var error = true;
            if (date.start && moment(date.start).isValid())
                error = false;
            if (date.end && moment(date.end).isValid()) 
                error = false;
            if (time.start && moment(moment(time.start, "hh:mm"), "hh:mm").isValid())
                error = false
            if (time.end && moment(moment(time.end, "hh:mm"), "hh:mm").isValid())
                error = false
            return error;
        } else {
            return true;
        }
    };

    /*Insert another activity id into dependencies list when create new activity
    only occur when new activity has isDependent property is true*/
    $scope.addToDependencies = function(activity, lagsUnit, lagsType) {
        if (!lagsUnit) {
            dialogService.showToast("Please enter Lags unit");
            return;
        }
        if (!lagsType) {
            dialogService.showToast("Please enter Lags type");
            return;
        }
        var index = _.findIndex($scope.activity.dependencies, function(dep) {
            return dep._id == activity._id;
        });
        if (index === -1) {
            activity.lagsUnit = lagsUnit;
            activity.lagsType = lagsType;
            $scope.activity.dependencies.push(activity);
            $scope.lagsType = null;
            $scope.lagsUnit = null;
        } else {
            dialogService.showToast("This activity has already in dependencies list");
        }
    };

    $scope.removeFromDependencies = function(index) {
        $scope.activity.dependencies.splice(index, 1);
    };

    /*Create new activity or milestone*/
    $scope.createActivityOrMilestone = function(form) {
        if (form.$valid) {
            $scope.activity.newMembers = _.filter($scope.membersList, {select: true});
            var error = false;
            if (!$scope.activity.isMilestone) {
                error = checkValidActualAndEstimateDateTime($scope.activity.date, $scope.activity.time);
            }
            if ($scope.activity.newMembers.length === 0) {
                dialogService.showToast("Please select at least 1 member");
                error = true;
            }

            if (error) {
                dialogService.showToast("Check your input again.");
            } else
                console.log($scope.activity);
                return;
                activityService.create({id: $stateParams.id}, $scope.activity).$promise.then(function(res) {
                    dialogService.showToast((res.isMilestone) ? "Create Milestone Successfully" : "Create Activity Successfully");
                    dialogService.closeModal();
                    activities.push(res);
                }, function(err) {dialogService.showToast("Error");});
        } else {
            dialogService.showToast("Check your input again.");
        }
    };
});