angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, activityService, people, activities, tasks, taskService) {
    $rootScope.title = "Calendar View";
    $scope.dialogService = dialogService;
    $scope.showTask = true;
    $scope.showEvent = true;
    
    // Filter showing task or event in calendar
    $scope.changeFilter = function(type) {
        if (type==="task") {
            $scope.showTask=!$scope.showTask;
        } else if (type==="event") {
            $scope.showEvent=!$scope.showEvent;
        }
    };

    /*config fullcalendar*/
    $scope.config = {
        calendar: {
            height: 450,
            header: {
                left: "month agendaWeek agendaDay",
                center: "title",
                right: "today, prev, next"
            },
            selectable: true,
            editable: true,
            eventClick: function(data) {
                if (data.type==="event") {
                    $mdDialog.show({
                        // targetEvent: $event,
                        controller: ["$rootScope", "$scope", "dialogService", "activity", "$stateParams", "$state", function($rootScope, $scope, dialogService, activity, $stateParams, $state) {
                            $scope.event = data;
                            $scope.dialogService = dialogService;
                            $scope.tasks = [];
                            $scope.threads = [];
                            $scope.files = [];
                            _.each(activity.relatedItem, function(item) {
                                if (item.type==="thread") {
                                    $scope.threads.push(item.item);
                                } else if (item.type==="task") {
                                    $scope.tasks.push(item.item);
                                } else if (item.type==="file") {
                                    $scope.files.push(item.item);
                                }
                            });

                            $scope.viewAll = function(type) {
                                dialogService.closeModal();
                                if (type==="task") {
                                    $state.go("project.tasks.all", {id: $stateParams.id});
                                } else if (type==="thread") {
                                    $state.go("project.messages.all", {id: $stateParams.id});
                                } else if (type==="file") {
                                    $state.go("project.files.all", {id: $stateParams.id});
                                }
                            };

                            $scope.attachItem = function(type) {
                                $rootScope.attachEventItem = {type: type, selectedEvent: data._id};
                                dialogService.closeModal();
                                if (type==="task") {
                                    $state.go("project.tasks.all", {id: $stateParams.id});
                                } else if (type==="thread") {
                                    $state.go("project.messages.all", {id: $stateParams.id});
                                } else if (type==="file") {
                                    $state.go("project.files.all", {id: $stateParams.id});
                                }
                            };
                        }],
                        resolve: {
                            activity: ["activityService", "$stateParams", function(activityService, $stateParams) {
                                return activityService.get({id: data._id}).$promise;
                            }]
                        },
                        templateUrl: 'app/modules/project/project-calendar/partials/event-detail.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: false
                    });
                } else if (data.type==="task"){
                    $state.go("project.tasks.detail", {id: $stateParams.id, taskId: data._id});
                }
            },
            eventDrop: function(event, delta) {
                console.log(event);
                if (event.type==="task") {
                    var updateTask = {
                        editType:"change-date-time",
                        dateStart: new Date(event.start),
                        dateEnd: new Date(event.end),
                        _id: event._id
                    }
                    taskService.update({id: updateTask._id}, updateTask).$promise.then(function(res) {
                        dialogService.showToast("Update Task Date Successfully");
                    }, function(err) {dialogService.showToast("Error");});
                } else if (event.type==="event") {
                    event.date = {
                        start: new Date(event.start),
                        end: new Date(event.end)
                    };
                    var updateEvent = {
                        editType:"change-date-time",
                        date: event.date,
                        _id: event._id
                    };
                    activityService.update({id: updateEvent._id}, updateEvent).$promise.then(function(res) {
                        dialogService.showToast("Update Event Date Time Successfully");
                    }, function(err) {dialogService.showToast("Error");});
                }
            }
        }
    };

    $scope.step = 1;
    $scope.next = function(type) {
        if (type === "milestone") {
            if ($scope.step==1) {
                if (!$scope.activity.name || $scope.activity.name.trim().length === 0) {
                    dialogService.showToast("Enter Milestone Name");
                } else {
                    $scope.step += 1;
                }
            }
        } else {
            if ($scope.step==1) {
                if (!$scope.activity.name || $scope.activity.name.trim().length === 0) {
                    dialogService.showToast("Enter Milestone Name");
                } else {
                    $scope.step += 1;
                }
            } else if ($scope.step==2) {
                if (!$scope.activity.date) {
                    dialogService.showToast("Please Check Your Date");
                } else if (!$scope.activity.time) {
                    dialogService.showToast("Please Check Your Time");
                } else {
                    if (moment(moment($scope.activity.date.start).format("YYYY-MM-DD")).isAfter(moment($scope.activity.date.end).format("YYYY-MM-DD")))
                        dialogService.showToast("End Date Must Greator Than Stat Date");
                    else if (!$scope.activity.time.start || !$scope.activity.time.end) {
                        dialogService.showToast("Please Check Your Time");
                    } else
                        $scope.step += 1;
                }
            }
        }
    };

    /*Convert all tasks and activities to calendar view*/
    $scope.convertAllToCalendarView = function() {
        $scope.events = [];
        $scope.eventsTask = [];
        $scope.eventsEvent = [];
        $scope.activities = activities;
        _.each(tasks, function(task) {
            if (task.element && task.element.type === "task-project") {
                var dateStart, dateEnd;
                if (task.time) {
                    dateStart = moment(task.dateStart).add(moment(task.time.start).hours(), "hours").add(moment(task.time.end).minutes(), "minutes");
                    dateEnd = moment(task.dateEnd).add(moment(task.time.end).hours(), "hours").add(moment(task.time.end).minutes(), "minutes");
                } else {
                    dateStart = moment(task.dateStart);
                    dateEnd = moment(task.dateEnd);
                }
                $scope.events.push({type: "task", _id: task._id, title: task.description, start: moment(dateStart).format("YYYY-MM-DD hh:mm"), end: moment(dateEnd).format("YYYY-MM-DD hh:mm")});
                $scope.eventsTask.push({type: "task", _id: task._id, title: task.description, start: moment(dateStart).format("YYYY-MM-DD hh:mm"), end: moment(dateEnd).format("YYYY-MM-DD hh:mm")});
            }
        });
        _.each(activities, function(activity) {
            if (!activity.isMilestone) {
                var dateStart = moment(activity.date.start).add(moment(activity.time.start).hours(), "hours").add(moment(activity.time.end).minutes(), "minutes");
                var dateEnd = moment(activity.date.end).add(moment(activity.time.end).hours(), "hours").add(moment(activity.time.end).minutes(), "minutes");
                $scope.events.push({type: "event", _id: activity._id,title: activity.name, start: moment(dateStart).format("YYYY-MM-DD hh:mm"), end: moment(dateEnd).format("YYYY-MM-DD hh:mm")});   
                $scope.eventsEvent.push({type: "event", _id: activity._id,title: activity.name, start: moment(dateStart).format("YYYY-MM-DD hh:mm"), end: moment(dateEnd).format("YYYY-MM-DD hh:mm")});   
            }
        });
        $scope.eventSources = [$scope.events];
        $scope.eventSourcesTask = [$scope.eventsTask];
        $scope.eventSourcesEvent = [$scope.eventsEvent];
        $scope.eventSourcesEmpty = [];
    };
    $scope.convertAllToCalendarView();

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

    $scope.activity = {};

    /*Show modal with valid name*/
    $scope.showModal = function($event, modalName) {
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

    /*Update start date, end date and duration when changed one*/
    /*var daysOfWeek = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    $scope.getChangeValue = function(type) {
        var validDuration = true;
        if (type === "du") {
            $scope.activity.date.duration = $scope.activity.date.duration.replace(/ /g,'');
            var lastChar = $scope.activity.date.duration.substr($scope.activity.date.duration.length -1);
            var duration = $scope.activity.date.duration.substr(0, $scope.activity.date.duration.length -1);
            if (duration > 0 && (lastChar === "d" || lastChar === "h")) {
                validDuration = true;
                $scope.dateError = null;
            } else {
                validDuration = false;
                $scope.dateError = "Not Valid Duraton";
            }
        }
        var totalTime = 0;
        if ($scope.activity.date.start && type === "du" && validDuration) {
            var scheduleTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.start).getDay()]];
            if (scheduleTime.startTime && scheduleTime.endTime) {
                $scope.activity.time = {start: new Date(scheduleTime.startTime)};
                var workTimeForADay = moment(moment(scheduleTime.endTime)).diff(moment(scheduleTime.startTime), "hours");
                if (lastChar==="h") {
                    if (duration <= workTimeForADay) {
                        // If the duration less then work time then grant activity date end the same as date start
                        $scope.activity.date.end = new Date(moment($scope.activity.date.start));
                        $scope.activity.time.end = new Date(moment(scheduleTime.startTime).add(duration, "hours"));
                    } else {
                        $scope.activity.date.end = new Date(moment($scope.activity.date.start).add(duration/workTimeForADay,"days"));
                        // Grant end time with activity end date time
                        var scheduleEndTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
                        if (scheduleEndTime.startTime && scheduleEndTime.endTime) {
                            $scope.activity.time.end = new Date(scheduleEndTime.endTime);
                        } else {
                            dialogService.showToast("Please Enter Work Time Of Your Team");
                            $scope.dateError = "Please Enter Work Time Of Your Team";    
                        }
                    }
                } else if (lastChar==="d") {
                    $scope.activity.date.end = new Date(moment($scope.activity.date.start).add(duration,"days"));
                    // Grant end time with activity end date time
                    var scheduleEndTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
                    if (scheduleEndTime.startTime && scheduleEndTime.endTime) {
                        $scope.activity.time.end = new Date(scheduleEndTime.endTime);
                    } else {
                        dialogService.showToast("Please Enter Work Time Of Your Team");
                        $scope.dateError = "Please Enter Work Time Of Your Team";    
                    }
                }
            } else {
                dialogService.showToast("Please Enter Work Time Of Your Team");
                $scope.dateError = "Please Enter Work Time Of Your Team";
            }
        } else if ($scope.activity.date.end && type==="du" && validDuration) {
            var scheduleTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
            if (scheduleTime.startTime && scheduleTime.endTime) {
                $scope.activity.time = {end: scheduleEndTime.endTime};
                var workTimeForADay = moment(moment(scheduleTime.endTime)).diff(moment(scheduleTime.startTime), "hours");
                if (lastChar==="h") {
                    if (duration <= workTimeForADay) {
                        // If the duration less then work time then grant activity date end the same as date start
                        $scope.activity.date.start = new Date(moment($scope.activity.date.end));
                        $scope.activity.time.start = new Date(moment(scheduleTime.endTime).subtract(duration, "hours"));
                    } else {
                        $scope.activity.date.start = new Date(moment($scope.activity.date.end).subtract(duration/workTimeForADay,"days"));
                        // Grant start time with activity start date time
                        var scheduleStartTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
                        if (scheduleStartTime.startTime && scheduleStartTime.endTime) {
                            $scope.activity.time.start = new Date(scheduleStartTime.startTime);
                        } else {
                            dialogService.showToast("Please Enter Work Time Of Your Team");
                            $scope.dateError = "Please Enter Work Time Of Your Team";    
                        }
                    }
                } else if (lastChar==="d") {
                    $scope.activity.date.start = new Date(moment($scope.activity.date.end).subtract(duration, "days"));
                    // Grant start time with activity start date time
                    var scheduleStartTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
                    if (scheduleStartTime.startTime && scheduleStartTime.endTime) {
                        $scope.activity.time.start = new Date(scheduleStartTime.startTime);
                    } else {
                        dialogService.showToast("Please Enter Work Time Of Your Team");
                        $scope.dateError = "Please Enter Work Time Of Your Team";    
                    }
                }
            } else {
                dialogService.showToast("Please Enter Work Time Of Your Team");
                $scope.dateError = "Please Enter Work Time Of Your Team";
            }
        } else if ((type === "st"||type==="et") && $scope.activity.date.end) {
            var scheduleStartTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.start).getDay()]];
            var scheduleEndTime = $rootScope.currentTeam.schedule[daysOfWeek[new Date($scope.activity.date.end).getDay()]];
            if (scheduleStartTime.startTime && scheduleEndTime.endTime) {
                $scope.activity.time = {
                    start: new Date(scheduleStartTime.startTime),
                    end: new Date(scheduleEndTime.endTime)
                };
                var totalDay = moment(moment($scope.activity.date.end)).diff(moment($scope.activity.date.start), 'days');
                if (totalDay*24 <= 24) {
                    $scope.activity.date.duration = "1d";
                } else {
                    $scope.activity.date.duration = totalDay+"d";
                }
            } else {
                dialogService.showToast("Please Enter Work Time Of Your Team");
                $scope.dateError = "Please Enter Work Time Of Your Team";
            }
        }

        if ($scope.activity.date) {
            if (moment(moment($scope.activity.date.start).format("YYYY-MM-DD")).isAfter(moment($scope.activity.date.end).format("YYYY-MM-DD")))
                $scope.dateError = "End Date Must Greator Than Stat Date";
            else if ($scope.activity.date.duration && $scope.activity.date.duration <= 0) 
                $scope.dateError = "Duration Must Greator Than 0";
            else if (validDuration && !$scope.dateError) ;
                $scope.dateError = null;
        }
    };*/

    /*Create new activity or milestone*/
    $scope.createActivityOrMilestone = function(form) {
        if (form.$valid) {
            $scope.activity.newMembers = _.filter($scope.membersList, {select: true});
            var error = false;
            var timeError = false;
            if ($scope.activity.date) {
                if (moment(moment($scope.activity.date.start).format("YYYY-MM-DD")).isSameOrBefore(moment($scope.activity.date.end).format("YYYY-MM-DD")))
                    error = false;
            } else
                error = true;
            if ($scope.activity.time) {
                if (!$scope.activity.time.start || !$scope.activity.time.end) 
                    timeError = true;
            } else
                timeError = true;
            if ($scope.activity.newMembers.length === 0) {
                dialogService.showToast("Please select at least 1 member");
                error = true;
            }
            if ($scope.activity.isBelongToMilestone && !$scope.activity.selectedMilestone) {
                dialogService.showToast("Please select a milestone");
                error = true;
            }
            if (!error && !timeError) {
                if ($scope.dateError) {
                    dialogService.showToast("Please Check Your Date Input");
                } else {
                    activityService.create({id: $stateParams.id}, $scope.activity).$promise.then(function(res) {
                        dialogService.showToast((res.isMilestone) ? "Create Milestone Successfully" : "Create Activity Successfully");
                        dialogService.closeModal();
                        activities.push(res);
                        convertAllToCalendarView();
                    }, function(err) {dialogService.showToast("Error");});
                }
            } else {
                dialogService.showToast("Check your input again.");
            }
        } else {
            dialogService.showToast("Check your input again.");
        }
    };
});