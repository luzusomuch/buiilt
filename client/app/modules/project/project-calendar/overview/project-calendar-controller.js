angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, activityService, people, activities, tasks, taskService, uiCalendarConfig) {
    $rootScope.title = "Calendar View";
    $scope.dialogService = dialogService;
    $scope.showTask = true;
    $scope.showEvent = true;

    $scope.search = function() {
        var result = [];
        if ($scope.searchTerm.trim().length > 0) {
            if ($scope.filteredEvents && $scope.filteredEvents.length) {
                _.each($scope.filteredEvents, function(ev) {
                    if (ev.title.indexOf($scope.searchTerm) !== -1) {
                        result.push(ev);
                    }
                });
            } else if ($scope.eventSources && $scope.eventSources[0].length > 0) {
                _.each($scope.eventSources[0], function(ev) {
                    if (ev.title.indexOf($scope.searchTerm) !== -1) {
                        result.push(ev);
                    }
                });
            }
        } else {
            if (!$scope.showEvent && !$scope.showTask) {
                result = [];
            } else if ($scope.showEvent && $scope.showTask) {
                result = $scope.originalEvents;
            } else if ($scope.showEvent && !$scope.showTask) {
                _.each($scope.events, function(ev) {
                    if (ev.type==="event") 
                        result.push(ev);
                });
            } else if (!$scope.showEvent && $scope.showTask) {
                _.each($scope.events, function(ev) {
                    if (ev.type==="task") 
                        result.push(ev);
                });
            }
        }
        uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
        uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', result);
    };
    
    // Filter showing task or event in calendar
    $scope.changeFilter = function(type) {
        $scope.filteredEvents = [];
        if (type==="task") {
            $scope.showTask=!$scope.showTask;
        } else if (type==="event") {
            $scope.showEvent=!$scope.showEvent;
        } else if (type==="all") {
            if (!$scope.showEvent) 
                $scope.showEvent = true;
            if (!$scope.showTask) 
                $scope.showTask = true;
            else {
                $scope.showTask = !$scope.showTask;
                $scope.showEvent = !$scope.showEvent;
            }
        }
        if (!$scope.showEvent && !$scope.showTask) {
            $scope.filteredEvents = [];
        } else if ($scope.showEvent && $scope.showTask) {
            $scope.filteredEvents = $scope.originalEvents;
        } else if ($scope.showEvent && !$scope.showTask) {
            _.each($scope.events, function(ev) {
                if (ev.type==="event") 
                    $scope.filteredEvents.push(ev);
            });
        } else if (!$scope.showEvent && $scope.showTask) {
            _.each($scope.events, function(ev) {
                if (ev.type==="task") 
                    $scope.filteredEvents.push(ev);
            });
        }
        var result = [];
        if ($scope.searchTerm && $scope.searchTerm.trim().length > 0) {
            _.each($scope.filteredEvents, function(ev) {
                if (ev.title.indexOf($scope.searchTerm) !== -1) 
                    result.push(ev);
            });
            $scope.filteredEvents = result;
        }
        uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
        uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.filteredEvents);
    };

    /*config fullcalendar*/
    $scope.uiConfig = {
        calendar: {
            height: 450,
            header: {
                left: "month agendaWeek agendaDay",
                center: "title",
                right: "today, prev, next"
            },
            selectable: true,
            editable: true,
            dayClick: function(day) {
                $rootScope.selectedStartDate = new Date(day);
                var confirm = $mdDialog.confirm()
                    .title('Create new Event or Task?')
                    .textContent('Please select one type to countinue')
                    .ariaLabel('Create Item')
                    .ok('New Event')
                    .cancel('New Task');
                $mdDialog.show(confirm).then(function() {
                    $scope.showModal("create-event.html");
                }, function() {
                    $scope.showModal("create-task.html");
                });
            },
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
    $scope.convertAllToCalendarView = function(isUpdate) {
        $scope.events = [];
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
            }
        });
        _.each(activities, function(activity) {
            if (!activity.isMilestone) {
                var dateStart = moment(activity.date.start).add(moment(activity.time.start).hours(), "hours").add(moment(activity.time.end).minutes(), "minutes");
                var dateEnd = moment(activity.date.end).add(moment(activity.time.end).hours(), "hours").add(moment(activity.time.end).minutes(), "minutes");
                $scope.events.push({type: "event", _id: activity._id,title: activity.name, start: moment(dateStart).format("YYYY-MM-DD hh:mm"), end: moment(dateEnd).format("YYYY-MM-DD hh:mm")});   
            }
        });
        $scope.originalEvents = angular.copy($scope.events);
        $scope.eventSources = [$scope.events];

        if (isUpdate) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.events);
        }
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

    $scope.activity = {
        date: {
            start: ($rootScope.selectedStartDate) ? $rootScope.selectedStartDate : new Date()
        }
    };

    /*Show modal with valid name*/
    $scope.showModal = function(modalName) {
        $mdDialog.show({
            // targetEvent: $event,
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
                        $scope.convertAllToCalendarView(true);
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