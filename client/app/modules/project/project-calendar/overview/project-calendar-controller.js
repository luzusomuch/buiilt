angular.module('buiiltApp').controller('projectCalendarCtrl', function($timeout, $q, $rootScope, $scope, $mdDialog, dialogService, $stateParams, socket, $state, activityService, people, activities, tasks, taskService, uiCalendarConfig) {
    $rootScope.title = "Calendar View";
    $scope.dialogService = dialogService;
    $scope.showTask = true;
    $scope.showEvent = true;
	
	$scope.showDetail = false;

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
		
        var height = ($("#calendar-content").outerHeight()/100)*72;
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
                        $scope.showModal("create-event.html");
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
                            controller: ["$rootScope", "$scope", "dialogService", "activity", "$stateParams", "$state", "activity", "tenderService", "messageService", "fileService", "taskService", "people", "$mdDialog", "activityService",
                            function($rootScope, $scope, dialogService, activity, $stateParams, $state, activity, tenderService, messageService, fileService, taskService, people, $mdDialog, activityService) {
                                // Only need to check architect and builder team
                                function checkAllowCreateTender() {
                                    if (people.builders.length > 0 && people.builders[0].hasSelect) {
                                        if (people.builders[0].tenderers[0]._id && people.builders[0].tenderers[0]._id._id.toString()===$rootScope.currentUser._id.toString()) {
                                            return true;
                                        }
                                    }
                                    if (people.architects.length > 0 && people.architects[0].hasSelect) {
                                        if (people.architects[0].tenderers[0]._id && people.architects[0].tenderers[0]._id._id.toString()===$rootScope.currentUser._id.toString()) {
                                            return true;
                                        }
                                    }
                                };

                                $scope.allowCreateTender = checkAllowCreateTender();
								
                                $scope.event = activity;
                                $scope.dialogService = dialogService;
                                $scope.tasks = [];
                                $scope.threads = [];
                                $scope.files = [];
                                $scope.tenders = [];
                                _.each(activity.relatedItem, function(item) {
                                    if (item.type==="thread") {
                                        $scope.threads.push(item.item);
                                    } else if (item.type==="task") {
                                        $scope.tasks.push(item.item);
                                    } else if (item.type==="file") {
                                        $scope.files.push(item.item);
                                    } else if (item.type==="tender") {
                                        $scope.tenders.push(item.item);
                                    }
                                });

                                $scope.changeDescription = function(){
                                    if ($scope.event.description.trim().length===0) {
                                        dialogService.showToast("Please Enter an Event Description...");
                                    } else {
                                        $scope.event.editType="change-description";
                                        activityService.update({id: $scope.event._id}, $scope.event).$promise.then(function(res) {
                                            dialogService.showToast("Event Description Changed Successfully.");
                                            $scope.showEdit = false;
                                        }, function(err) {
                                            dialogService.showToast("There Has Been An Error...");
                                        });
                                    }
                                };

                                $scope.viewAll = function(type) {
                                    $rootScope.selectedFilterEvent = activity._id;
                                    dialogService.closeModal();
                                    if (type==="task") {
                                        $state.go("project.tasks.all", {id: $stateParams.id});
                                    } else if (type==="thread") {
                                        $state.go("project.messages.all", {id: $stateParams.id});
                                    } else if (type==="file") {
                                        $state.go("project.files.all", {id: $stateParams.id});
                                    } else if (type==="tender") {
                                        $state.go("project.tenders.all", {id: $stateParams.id});
                                    }
                                };

                                $scope.view = function(type, item) {
                                    dialogService.closeModal();
                                    if (type==="thread") {
                                        $state.go("project.messages.detail", {id: $stateParams.id, messageId: item._id});
                                    } else if (type==="file") {
                                        $state.go("project.files.detail", {id: $stateParams.id, fileId: item._id});
                                    } else if (type==="tender") {
                                        $state.go("project.tenders.detail", {id: $stateParams.id, tenderId: item._id});
                                    } else if (type==="task") {
                                        viewTaskDetail(item);
                                    }
                                };

                                $scope.attachItem = function(type) {
                                    // $rootScope.attachEventItem = {type: type, selectedEvent: data._id};
                                    // dialogService.closeModal();
                                    // if (type==="task") {
                                    //     $state.go("project.tasks.all", {id: $stateParams.id});
                                    // } else if (type==="thread") {
                                    //     $state.go("project.messages.all", {id: $stateParams.id});
                                    // } else if (type==="file") {
                                    //     $state.go("project.files.all", {id: $stateParams.id});
                                    // }
                                    if (type==="task") {
                                        $rootScope.selectedEvent = activity._id;
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
                                            templateUrl: 'app/modules/project/project-calendar/partials/create-task.html',
                                            parent: angular.element(document.body),
                                            clickOutsideToClose: false
                                        });
                                    } else if (type==="thread") {
                                        var newThread = {
                                            type: "project-message",
                                            members: [],
                                            selectedEvent: activity._id
                                        };
                                        messageService.create({id: activity.project}, newThread).$promise.then(function(res) {
                                            dialogService.closeModal();
                                            dialogService.showToast("New Thread Created Successfully.");
                                            $rootScope.$emit("Thread.Inserted", res);
                                            $rootScope.openDetail = true;
                                            $state.go("project.messages.detail", {id: activity.project, messageId: res._id});
                                        }, function(err) {
                                            dialogService.showToast("There Has Been An Error...");
                                        });
                                    } else if (type==="file") {
                                        var newFile = {
                                            type: "file",
                                            members: [],
                                            tags: [],
                                            selectedEvent: activity._id
                                        };
                                        fileService.create({id: activity.project}, newFile).$promise.then(function(res) {
                                            dialogService.closeModal();
                                            dialogService.showToast("New File Created Successfully.");
                                            $rootScope.openDetail = true;
                                            $state.go("project.files.detail", {id: activity.project, fileId: res._id});
                                        }, function(err) {
                                            dialogService.showToast("There Has Been An Error...");
                                        });
                                    } else if (type==="tender") {
                                        if (!$scope.allowCreateTender) {
                                            dialogService.showToast("You Are Not Allowed to Attach This to a Tender");
                                        } else {
                                            var newTender = {
                                                project: $rootScope.project,
                                                selectedEvent: activity._id
                                            };
                                            tenderService.create(newTender).$promise.then(function(res) {
                                                dialogService.closeModal();
                                                dialogService.showToast("New Tender Created Successfully.");
                                                $rootScope.openDetail = true;
                                                $state.go("project.tenders.detail", {id: res.project, tenderId: res._id});
                                            }, function(err) {
                                                dialogService.showToast("There Has Been An Error...");
                                            });
                                        }
                                    }
                                };
                            }],
                            resolve: {
                                activity: ["activityService", function(activityService) {
                                    return activityService.get({id: data._id}).$promise;
                                }],
                                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                                }]
                            },
                            templateUrl: 'app/modules/project/project-calendar/partials/event-detail.html',
                            parent: angular.element(document.body),
                            clickOutsideToClose: false
                        });
                    } else if (data.type==="task"){
                        viewTaskDetail(data);
                    }
                },
                eventDrop: function(event, delta) {
                    if (event.type==="task") {
                        var updateTask = updateTaskDateTime(event, delta);
                        taskService.update({id: updateTask._id}, updateTask).$promise.then(function(res) {
                            dialogService.showToast("Task Has Been Updated Successfully.");
                        }, function(err) {dialogService.showToast("There Has Been An Error...");});
                    } else if (event.type==="event") {
                        var updateEvent = updateEventDateTime(event, delta);
                        activityService.update({id: updateEvent._id}, updateEvent).$promise.then(function(res) {
                            dialogService.showToast("Event Has Been Updated Successfully.");
                        }, function(err) {dialogService.showToast("There Has Been An Error...");});
                    }
                },
                eventResize: function(event, delta) {
                    if (event.type==="event") {
                        var updateEvent = updateEventDateTime(event, delta);
                        activityService.update({id: updateEvent._id}, updateEvent).$promise.then(function(res) {
                            dialogService.showToast("Event Has Been Updated Successfully.");
                        }, function(err) {dialogService.showToast("There Has Been An Error...");});
                    } else if (event.type==="task") {
                        var updateTask = updateTaskDateTime(event, delta);
                        taskService.update({id: updateTask._id}, updateTask).$promise.then(function(res) {
                            dialogService.showToast("Task Has Been Updated Successfully.");
                        }, function(err) {dialogService.showToast("There Has Been An Error...");});
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
            } 
            // else if ($scope.step==2) {
            //     if (!$scope.activity.date) {
            //         dialogService.showToast("Please Check Your Date");
            //     } else {
            //         if (moment(moment($scope.activity.date.start).format("YYYY-MM-DD")).isAfter(moment($scope.activity.date.end).format("YYYY-MM-DD")))
            //             dialogService.showToast("End Date Must Greator Than Stat Date");
            //         else
            //             $scope.step += 1;
            //     }
            // }
        }
    };

    /*Convert all tasks and activities to calendar view*/
    $scope.convertAllToCalendarView = function(isUpdate) {
        $scope.events = [];
        $scope.activities = activities;
        $scope.tasks = tasks;
        _.each($scope.tasks, function(task) {
            if (task.element && task.element.type === "task-project") {
                var dateStart, dateEnd;
                if (task.time && task.time.start && task.time.end) {
                    dateStart = new Date(task.dateStart).setHours(moment(task.time.start).hours(), moment(task.time.start).minutes());
                    dateEnd = new Date(task.dateEnd).setHours(moment(task.time.end).hours(), moment(task.time.end).minutes());
                } else {
                    dateStart = new Date(task.dateStart);
                    dateEnd = new Date(task.dateEnd);
                }
                var title = task.description;
				
                $scope.events.push({type: "task", _id: task._id, title: title, start: dateStart, end: dateEnd, "backgroundColor": (task.__v > 0) ? "#FFC107" : "#2196F3", allDay: false});
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
            // var error = false;
            // if ($scope.activity.newMembers.length === 0) {
            //     dialogService.showToast("Please select at least 1 member");
            //     error = true;
            // }
            // if ($scope.activity.isBelongToMilestone && !$scope.activity.selectedMilestone) {
            //     dialogService.showToast("Please select a milestone");
            //     error = true;
            // }
            // if (!error) {
                if (!$scope.activity.date.start || !$scope.activity.date.end) {
                    dialogService.showToast("Please Check Your Dates...");
                } else {
                    activityService.create({id: $stateParams.id}, $scope.activity).$promise.then(function(res) {
                        dialogService.showToast((res.isMilestone) ? "Create Milestone Successfully" : "Event Has Been Created Successfully.");
                        dialogService.closeModal();
                        activities.push(res);
                        $scope.convertAllToCalendarView(true);
                    }, function(err) {dialogService.showToast("There Has Been An Error...");});
                }
            // } else {
            //     dialogService.showToast("Check your input again.");
            // }
        } else {
            dialogService.showToast("Please Check Your Inputs - Something Is Missing...");
        }
    };

    $scope.task = {
        selectedEvent: ($rootScope.selectedEvent) ? $rootScope.selectedEvent : null,
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
                $rootScope.selectedEvent = null;
            }, function(err) {dialogService.showToast("There Has Been An Error...");});
            // } else {
            //     dialogService.showToast("Check your input again.");
            // }
        } else {
            dialogService.showToast("Please Check Your Input Again - Something Is Missing...");
        }
    };

    function viewTaskDetail(data) {
        $mdDialog.show({
            // targetEvent: $event,
            controller: ["$timeout", "$rootScope", "$scope", "dialogService", "socket", "activity", "task", "people", "notificationService", 
            function($timeout, $rootScope, $scope, dialogService, socket, activity, task, people, notificationService) {
                $scope.task = task;
                $scope.dialogService = dialogService;
                $scope.allowShowList = ["create-task", "edit-task", "change-date-time", "complete-task", "uncomplete-task", "enter-comment"];

                $timeout(function() {
                    if ($scope.task.__v > 0) {
                        notificationService.markItemsAsRead({id: task._id}).$promise.then(function() {
                            $rootScope.$emit("Task.Read", task);
                            $rootScope.$emit("UpdateCountNumber", {type: "task", number: (task.__v>0)?1:0});
                        });
                    }
                }, 500);
                
                // socket handle
                socket.emit("join", task._id);
                socket.on("task:update", function(data) {
                    $scope.task = data;
                    getProjectMembers();
                    notificationService.markItemsAsRead({id: task._id}).$promise.then();
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
                            if (!$scope.projectMembers._id) {
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
                        dialogService.showToast("Please Provide a Comment...");
                    } else {
                        $scope.task.editType = "enter-comment";
                        $scope.task.comment = $scope.comment;
                        $scope.update($scope.task);
                    }
                };

                $scope.changeDescription = function() {
                    if ($scope.task.description.trim().length===0) {
                        dialogService.showToast("Please Provide a Task Descrition...");
                    } else {
                        $scope.task.editType="edit-task";
                        $scope.update($scope.task);
                    }
                };

                $scope.completeTask = function() {
                    $scope.task.completed = !$scope.task.completed;
                    if ($scope.task.completed) {
                        $scope.task.completedBy = $rootScope.currentUser._id;
                        $scope.task.editType = "complete-task";
                        $scope.task.completedAt = new Date();
                    } else {
                        $scope.task.completedBy = null;
                        $scope.task.editType = "uncomplete-task";
                        $scope.task.completedAt = null;
                    }
                    $scope.update($scope.task);
                };

                $scope.update = function(task) {
                    taskService.update({id: task._id}, task).$promise.then(function(res) {
                        if (task.editType==="enter-comment") {
                            $scope.comment = null;
                            dialogService.showToast("New Comment Has Been Added.");
                        } else if (task.editType==="edit-task") {
                            dialogService.showToast("Task Description Has Been Updated.");
                        } else if (task.editType==="assign") {
                            dialogService.showToast("Assignees Added to Task Successfully.");
                        } else if (task.editType==="complete-task") {
                            dialogService.showToast("Task Has Been Marked Complete.");
                        } else if (task.editType==="uncomplete-task") {
                            dialogService.showToast("Task Has Been Marked Incomplete.");
                        }
                        $scope.showEdit = false;
                    }, function(err) {
                        dialogService.showToast("There Has Been An Error...");
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
    };

    socket.on("dashboard:new", function(data) {
        if (data.type==="task") {
            var index = _.findIndex($scope.tasks, function(task) {
                return task._id.toString()===data.task._id.toString();
            });
            if (index !==-1 && data.user._id.toString()!==$rootScope.currentUser._id.toString() && $scope.tasks[index].uniqId!=data.uniqId) {
                if ($scope.tasks[index].__v===0) {
                    $rootScope.$emit("UpdateCountNumber", {type: "task", isAdd: true});
                }
                $scope.tasks[index].uniqId=data.uniqId;
                $scope.tasks[index].__v+=1;
                $scope.convertAllToCalendarView(true);
            }
        }
    });

    $rootScope.$on("Task.Read", function(ev, data) {
        var index = _.findIndex($scope.tasks, function(task) {
            return task._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            $scope.tasks[index].__v=0;
            $scope.convertAllToCalendarView(true);
        }
    });

});