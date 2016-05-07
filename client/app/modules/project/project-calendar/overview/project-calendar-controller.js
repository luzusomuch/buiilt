angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, activityService, people, activities, tasks, taskService, uiCalendarConfig) {
    $rootScope.title = "Calendar View";
    $scope.dialogService = dialogService;
    $scope.showTask = true;
    $scope.showEvent = true;

    $scope.search = function() {
        var result = [];
        if ($scope.searchTerm.trim().length > 0) {
            $scope.searchTerm = $scope.searchTerm.toLowerCase();
            if ($scope.filteredEvents && $scope.filteredEvents.length) {
                _.each($scope.filteredEvents, function(ev) {
                    if (ev.title.indexOf($scope.searchTerm) !== -1 || ev.title.toLowerCase().indexOf($scope.searchTerm) !== -1) {
                        result.push(ev);
                    }
                });
            } else if ($scope.eventSources && $scope.eventSources[0].length > 0) {
                _.each($scope.eventSources[0], function(ev) {
                    if (ev.title.indexOf($scope.searchTerm) !== -1 || ev.title.toLowerCase().indexOf($scope.searchTerm) !== -1) {
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
            $scope.searchTerm = $scope.searchTerm.toLowerCase();
            _.each($scope.filteredEvents, function(ev) {
                if (ev.title.indexOf($scope.searchTerm) !== -1 || ev.title.toLowerCase().indexOf($scope.searchTerm) !== -1) 
                    result.push(ev);
            });
            $scope.filteredEvents = result;
        }
        uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
        uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.filteredEvents);
    };

    /*config fullcalendar*/
    $timeout(function() {
		
        var height = ($("#calendar-content").outerHeight()/100)*63;
        $scope.uiConfig = {
            calendar: {
                height: height,
                header: {
                    left: "month agendaWeek agendaDay",
                    center: "title",
                    right: "today, prev, next"
                },
                selectable: true,
                editable: true,
                minTime: "6:00:00",
                maxTime: "22:00:00",
                timezone: "local",
                select: function(start, end, jsEv, view) {
                    $rootScope.selectedStartDate = new Date(start);
                    $rootScope.selectedEndDate = new Date(end);
                    if (view.name==="month") {
                        $scope.showModal("create-task-or-event.html");
                    } else if (!start.hasTime() && !end.hasTime()) {
                        $scope.showModal("create-event.html");
                    } else {
                        $scope.showModal("create-task.html");
                    }
                },
                eventClick: function(data) {
                    if (data.type==="event") {
                        $mdDialog.show({
                            // targetEvent: $event,
                            controller: ["$rootScope", "$scope", "dialogService", "activity", "$stateParams", "$state", function($rootScope, $scope, dialogService, activity, $stateParams, $state) {
								
								$scope.editDescription = false;
								$scope.editAssignees = false;
								$scope.showTasks = false;
								$scope.showMessages = false;
								$scope.showFiles = false;
								$scope.showTenders = false;
								
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
                        $mdDialog.show({
                            // targetEvent: $event,
                            controller: ["$rootScope", "$scope", "dialogService", "socket", "activity", "task", "people", function($rootScope, $scope, dialogService, socket, activity, task, people) {
                                $scope.task = task;
                                $scope.dialogService = dialogService;
                                $scope.allowShowList = ["create-task", "edit-task", "change-date-time", "complete-task", "uncomplete-task"];
                                
                                // socket handle
                                socket.emit("join", task._id);
                                socket.on("task:update", function(data) {
                                    $scope.task = data;
                                    getProjectMembers();
                                });
                                // end socket handle

                                // get project member
                                function getProjectMembers(){
                                    $scope.projectMembers = $rootScope.getProjectMembers(people);
                                    _.each($scope.task.members, function(member) {
                                        var index = _.findIndex($scope.projectMembers, function(projectMember){
                                            if (projectMember._id) {
                                                return projectMember._id.toString()===member._id.toString();
                                            }
                                        });
                                        if (index !== -1) {
                                            $scope.projectMembers.splice(index, 1);
                                        }
                                    });
                                    _.each($scope.task.notMembers, function(email) {
                                        var index = _.findIndex($scope.projectMembers, function(projectMember) {
                                            if (!projectMembers._id) {
                                                return projectMember.email==email;
                                            }
                                        });
                                        if (index !== -1) {
                                            $scope.projectMembers.splice(index, 1);
                                        }
                                    });
                                };
                                getProjectMembers();

                                $scope.assignMember = function(index) {
                                    $scope.task.newMembers = [$scope.projectMembers[index]];
                                    $scope.task.editType="assign";
                                    $scope.update($scope.task);
                                };


                                $scope.addComment = function() {
                                    if (!$scope.comment || $scope.comment.trim().length===0) {
                                        dialogService.showToast("Please Enter Your Comment");
                                    } else {
                                        $scope.task.editType = "enter-comment";
                                        $scope.task.comment = $scope.comment;
                                        $scope.update($scope.task);
                                    }
                                };

                                $scope.changeDescription = function() {
                                    if ($scope.task.description.trim().length===0) {
                                        dialogService.showToast("Task Description Must Be Enter");
                                    } else {
                                        $scope.task.editType="edit-task";
                                        $scope.update($scope.task);
                                    }
                                };

                                $scope.update = function(task) {
                                    taskService.update({id: task._id}, task).$promise.then(function(res) {
                                        console.log(res);
                                        if (task.editType==="enter-comment") {
                                            $scope.comment = null;
                                            dialogService.showToast("Enter New Comment Successfully");
                                        } else if (task.editType==="edit-task") {
                                            dialogService.showToast("Change Task Description Successfully");
                                        } else if (task.editType==="assign") {
                                            dialogService.showToast("Assign Members To Task Successfully");
                                        }
                                        $scope.showEdit = false;
                                    }, function(err) {
                                        dialogService.showToast("Error");
                                    });
                                };
                            }],
                            resolve: {
                                activity: ["activityService", "$stateParams", function(activityService, $stateParams) {
                                    return activityService.me({id: $stateParams.id}).$promise;
                                }],
                                task: ["taskService", "$stateParams", function(taskService, $stateParams) {
                                    return taskService.get({id: data._id}).$promise;
                                }],
                                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                                }]
                            },
                            templateUrl: 'app/modules/project/project-calendar/partials/task-detail.html',
                            parent: angular.element(document.body),
                            clickOutsideToClose: false
                        });
						
                    }
                },
                eventDrop: function(event, delta) {
                    if (event.type==="task") {
                        var updateTask = updateTaskDateTime(event, delta);
                        taskService.update({id: updateTask._id}, updateTask).$promise.then(function(res) {
                            dialogService.showToast("Update Task Date Successfully");
                        }, function(err) {dialogService.showToast("Error");});
                    } else if (event.type==="event") {
                        var updateEvent = updateEventDateTime(event, delta);
                        activityService.update({id: updateEvent._id}, updateEvent).$promise.then(function(res) {
                            dialogService.showToast("Update Event Date Time Successfully");
                        }, function(err) {dialogService.showToast("Error");});
                    }
                },
                eventResize: function(event, delta) {
                    if (event.type==="event") {
                        var updateEvent = updateEventDateTime(event, delta);
                        activityService.update({id: updateEvent._id}, updateEvent).$promise.then(function(res) {
                            dialogService.showToast("Update Event Date Time Successfully");
                        }, function(err) {dialogService.showToast("Error");});
                    } else if (event.type==="task") {
                        var updateTask = updateTaskDateTime(event, delta);
                        taskService.update({id: updateTask._id}, updateTask).$promise.then(function(res) {
                            dialogService.showToast("Update Task Date Successfully");
                        }, function(err) {dialogService.showToast("Error");});
                    }
                }
            }
        };
    }, 500);

    function updateEventDateTime(event, delta) {
        var result = {
            _id: event._id,
            editType: "change-date-time",
            date: {
                start: new Date(event.start),
                end: new Date(event.end)
            }
        };
        return result;
    };

    function updateTaskDateTime(event, delta) {
        return result = {
            _id: event._id,
            editType: "change-date-time",
            dateStart: new Date(event.start),
            dateEnd: new Date(event.end),
            time: {
                start: new Date(event.start),
                end: new Date(event.end)
            }
        };
    }

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
        } else if (type==="task") {
            if (!$scope.task.time || !$scope.task.time.start || !$scope.task.time.end || !$scope.task.selectedEvent || !$scope.task.description || !$scope.task.dateEnd) {
                dialogService.showToast("Check Your Input");
            } else {
                $scope.step += 1;
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
                } else {
                    if (moment(moment($scope.activity.date.start).format("YYYY-MM-DD")).isAfter(moment($scope.activity.date.end).format("YYYY-MM-DD")))
                        dialogService.showToast("End Date Must Greator Than Stat Date");
                    else
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
                if (task.time && task.time.start && task.time.end) {
                    dateStart = new Date(task.dateStart).setHours(moment(task.time.start).hours(), moment(task.time.start).minutes());
                    dateEnd = new Date(task.dateEnd).setHours(moment(task.time.end).hours(), moment(task.time.end).minutes());
                } else {
                    dateStart = new Date(task.dateStart);
                    dateEnd = new Date(task.dateEnd);
                }
                $scope.events.push({type: "task", _id: task._id, title: task.description, start: dateStart, end: dateEnd, "backgroundColor": "#2196F3", allDay: false});
            }
        });
        _.each(activities, function(activity) {
            if (!activity.isMilestone) {
                $scope.events.push({type: "event", _id: activity._id,title: activity.name, start: moment(activity.date.start).format("YYYY-MM-DD hh:mm"), end: moment(activity.date.end).format("YYYY-MM-DD hh:mm"), "backgroundColor": "#0D47A1", allDay: true});   
            }
        });
        $scope.originalEvents = angular.copy($scope.events);
        $scope.eventSources = [$scope.events];

        if (isUpdate) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.events);
        }

        $timeout(function() {
            $(document).ready(function() {
                $("div.fc-toolbar").children().children("button").removeClass("fc-month-button fc-button fc-state-default fc-corner-left fc-corner-right").addClass("md-primary md-button");
            });
        }, 1500);
    };
    $scope.convertAllToCalendarView();

    /*Get all project members*/
    function getProjectMembers() {
        // get unique member 
        $scope.membersList = _.uniq($rootScope.getProjectMembers(people), "_id");
        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
    };
    getProjectMembers();

    $scope.activity = {
        date: {
            start: ($rootScope.selectedStartDate) ? $rootScope.selectedStartDate : new Date(),
            end: ($rootScope.selectedEndDate) ? $rootScope.selectedEndDate : new Date().getDate()+1
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
            if ($scope.activity.newMembers.length === 0) {
                dialogService.showToast("Please select at least 1 member");
                error = true;
            }
            if ($scope.activity.isBelongToMilestone && !$scope.activity.selectedMilestone) {
                dialogService.showToast("Please select a milestone");
                error = true;
            }
            if (!error) {
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

    $scope.task = {
        dateStart: ($rootScope.selectedStartDate) ? $rootScope.selectedStartDate : new Date(),
        dateEnd: ($rootScope.selectedEndDate) ? $rootScope.selectedEndDate : new Date()
    };
    if ($rootScope.selectedStartDate && $rootScope.selectedEndDate) {
        $scope.task.time = {
            start: $rootScope.selectedStartDate,
            end: $rootScope.selectedEndDate
        };
        // $scope.task.dateEnd = $rootScope.selectedEndDate;
    } 
    // else if ($rootScope.selectedStartDate && moment($rootScope.selectedStartDate).hours() > 0) {
    //     $scope.task.time = {
    //         start: $rootScope.selectedStartDate
    //     };
    // }

    $scope.createNewTask = function(form) {
        if (form.$valid) {
            // if ($scope.task.members.length > 0 && $scope.task.selectedEvent) {
            $scope.task.members = _.filter($scope.membersList, {select: true});
            $scope.task.type = "task-project";
            taskService.create({id: $stateParams.id}, $scope.task).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("New Task Has Been Created Successfully.");
                
                //Track New Task
                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("New Task Created");
                $rootScope.$emit("Task.Inserted", res);
                tasks.push(res);
                $scope.convertAllToCalendarView(true);
            }, function(err) {dialogService.showToast("There Has Been An Error...");});
            // } else {
            //     dialogService.showToast("Check your input again.");
            // }
        } else {
            dialogService.showToast("Check your input again.");
        }
    };

});