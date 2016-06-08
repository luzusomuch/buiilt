angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, $mdDialog, $mdToast, $stateParams, projectService, myTasks, myMessages, myFiles, notificationService, taskService, peopleService, messageService, fileService, socket, uploadService, dialogService, activities, myDocuments, uiCalendarConfig, activityService) {
	$scope.step = 1;
    $scope.dialogService = dialogService;
    $rootScope.title = "Dashboard";
	$scope.myTasks = myTasks;
	$scope.myMessages = myMessages;
	$scope.myFiles = myFiles;
    $scope.activities = activities;
    $scope.myDocuments = myDocuments;
    if ($scope.myDocuments.length > 0) {
        $scope.selectedDocumentSet = $scope.myDocuments[0];
    }
    $scope.projects = [];
    _.each($rootScope.projects, function(project) {
        if (project.status==="waiting") {
            $scope.projects.push(project);
        }
    });
    $scope.projectFilterTags = angular.copy($scope.projects);
    $scope.currentUser = $rootScope.currentUser;
	$scope.showFilter = false;

    /*Show modal with valid modal name*/
    $rootScope.showModal = $scope.showModal = function(name) {
        $mdDialog.show({
            controller: "dashboardCtrl",
            resolve: {
                myTasks: ["taskService", function(taskService) {
                    return taskService.myTask().$promise;
                }],
                myMessages: ["messageService", function(messageService) {
                    return messageService.myMessages().$promise;
                }],
                myFiles: ["fileService" ,function(fileService) {
                    return fileService.myFiles().$promise;
                }],
                activities: ["activityService", function(activityService) {
                    return activityService.me({id: "me"}).$promise;
                }],
                myDocuments: ["documentService", function(documentService) {
                    return documentService.me({id: "me"}).$promise;
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/' + name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    // Calendar section

    /*config fullcalendar*/
    $timeout(function(){
        var height = ($("#dash-calendar-content").outerHeight()/100)*70;
        $scope.uiConfig = {
            calendar: {
                height: height,
                header: {
                    left: "month agendaWeek agendaDay",
                    center: "title",
                    right: "today, prev, next"
                },
                selectable: true,
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
                        $scope.showModal("project-task-new.html");
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
                                        dialogService.showToast("Please Enter a Project Description...");
                                    } else {
                                        $scope.event.editType="change-description";
                                        activityService.update({id: $scope.event._id}, $scope.event).$promise.then(function(res) {
                                            dialogService.showToast("Updated the Project Description Successfully.");
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
                                        $state.go("project.tasks.all", {id: data.project});
                                    } else if (type==="thread") {
                                        $state.go("project.messages.all", {id: data.project});
                                    } else if (type==="file") {
                                        $state.go("project.files.all", {id: data.project});
                                    } else if (type==="tender") {
                                        $state.go("project.tenders.all", {id: data.project});
                                    }
                                };

                                $scope.view = function(type, item) {
                                    dialogService.closeModal();
                                    if (type==="thread") {
                                        $state.go("project.messages.detail", {id: data.project, messageId: item._id});
                                    } else if (type==="file") {
                                        $state.go("project.files.detail", {id: data.project, fileId: item._id});
                                    } else if (type==="tender") {
                                        $state.go("project.tenders.detail", {id: data.project, tenderId: item._id});
                                    } else if (type==="task") {
                                        viewTaskDetail(item);
                                    }
                                };

                                $scope.attachItem = function(type) {
                                    if (type==="task") {
                                        $rootScope.selectedEvent = activity._id;
                                        $rootScope.showModal("project-task-new.html");
                                        $rootScope.selectedProjectId = activity.project;
                                    } else if (type==="thread") {
                                        var newThread = {
                                            type: "project-message",
                                            members: [],
                                            selectedEvent: activity._id
                                        };
                                        messageService.create({id: activity.project}, newThread).$promise.then(function(res) {
                                            dialogService.closeModal();
                                            dialogService.showToast("New Thread Created Succesfully.");
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
                                            dialogService.showToast("You Can Not Attach This To a Tender.");
                                        } else {
                                            var newTender = {
                                                project: data.project,
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
                                    return peopleService.getInvitePeople({id: data.project}).$promise;
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

    /*Render tasks and events list to calendar view*/
    function renderTasksAndEventsToCalendar(isUpdate) {
        $scope.events = [];
        _.each($scope.myTasks, function(task) {
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
                $scope.events.push({type: "task", _id: task._id, title: title, project: (task.project._id) ? task.project._id : task.project, start: dateStart, end: dateEnd, "backgroundColor": (task.__v > 0) ? "#FFC107" : "#2196F3", allDay: false, editable: true});
            }
        });
        _.each($scope.activities, function(activity) {
            if (!activity.isMilestone) {
                $scope.events.push({type: "event", _id: activity._id, project: activity.project, title: activity.name, start: moment(activity.date.start).format("YYYY-MM-DD hh:mm"), end: moment(activity.date.end).format("YYYY-MM-DD hh:mm"), "backgroundColor": "#0D47A1", allDay: true, editable: (activity.owner==$rootScope.currentUser._id) ? true : false});   
            }
        });
        $scope.originalEvents = angular.copy($scope.events);
        $scope.eventSources = [$scope.events];

        if (isUpdate) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.events);
        }
    };
    renderTasksAndEventsToCalendar();

    function viewTaskDetail(data) {
        $mdDialog.show({
            // targetEvent: $event,
            controller: ["$timeout", "$rootScope", "$scope", "dialogService", "socket", "activity", "task", "people", "notificationService", 
            function($timeout, $rootScope, $scope, dialogService, socket, activity, task, people, notificationService) {
                var originalTask = angular.copy(task);
                $scope.task = task;
                $scope.task.selectedEvent = task.event;
                $scope.activities = activity;
                $scope.dialogService = dialogService;
                $scope.allowShowList = ["create-task", "edit-task", "change-date-time", "complete-task", "uncomplete-task", "enter-comment"];

                $timeout(function() {
                    if ($scope.task.__v > 0) {
                        notificationService.markItemsAsRead({id: task._id}).$promise.then(function() {
                            $rootScope.$emit("Task.Read", task);
                            $rootScope.$emit("UpdateCountNumber", {type: "task", number: (task.__v>0)?1:0});
                            $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", number: 1});
                        });
                    }
                }, 500);
                
                // socket handle
                socket.emit("join", task._id);
                socket.on("task:update", function(task) {
                    originalTask = angular.copy(task);
                    $scope.task = task;
                    $scope.task.selectedEvent = task.event;
                    getProjectMembers();
                    if (data._id.toString()===task._id.toString()) {
                        notificationService.markItemsAsRead({id: task._id}).$promise.then();
                    }
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
                        dialogService.showToast("Please Enter Your Comment...");
                    } else {
                        $scope.task.editType = "enter-comment";
                        $scope.task.comment = $scope.comment;
                        $scope.update($scope.task);
                    }
                };

                $scope.changeOrAddEvent = function() {
                    if (originalTask.event) {
                        $scope.task.editType="change-event"
                    } else {
                        $scope.task.editType="add-event";
                    }
                    $scope.update($scope.task);
                };

                $scope.changeDescription = function() {
                    if ($scope.task.description.trim().length===0) {
                        dialogService.showToast("Please Enter a Task Description...");
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
                            dialogService.showToast("Your Comment Has Been Added.");
                        } else if (task.editType==="edit-task") {
                            $scope.editDescription=false;
                            dialogService.showToast("Task Description Updated Successfully.");
                        } else if (task.editType==="assign") {
                            dialogService.showToast("Assignees Added to the Task Successfully.");
                        } else if (task.editType==="complete-task") {
                            dialogService.showToast("Task Has Been Marked Completed.");
                        } else if (task.editType==="uncomplete-task") {
                            dialogService.showToast("Task Has Been Marked Incomplete.");
                        } else if (task.editType==="add-event") {
                            dialogService.showToast("Add Event Successfully");
                        } else if (task.editType==="change-event") {
                            dialogService.showToast("Change Event Successfully");
                        }
                        $scope.showEdit = false;
                    }, function(err) {
                        dialogService.showToast("There Has Been An Error...");
                    });
                };
            }],
            resolve: {
                activity: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: data.project}).$promise;
                }],
                task: ["taskService", "$stateParams", function(taskService, $stateParams) {
                    return taskService.get({id: data._id}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: data.project}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-calendar/partials/task-detail.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    // End calendar section

    $scope.selectProject = function(index) {
        $scope.selectedProjectIndex = index;
        getProjectMembers($scope.projects[index]._id);
    };

    /*Validate info and allow next in modal*/
    $scope.next = function(type) {
        if (type!=="activity") {
            if ($scope.step === 1) {
                if ($scope.selectedProjectIndex || $scope.selectedProjectIndex===0) {
                    $scope.step += 1;
                } else {
                    dialogService.showToast("Please Select a Project");
                }
            } else if ($scope.step === 2) {
                if (type==="createTask") {
                    if (!$scope.task.description || $scope.task.description.trim().length === 0 || !$scope.task.dateEnd || !$scope.task.dateStart || !$scope.task.time.start || !$scope.task.time.end) {
                        dialogService.showToast("Please Check Your Input - Something is Missing...");
                        return;
                    }
                    $scope.step += 1;
                } else if (type==="createThread") {
                    if (!$scope.thread.name || $scope.thread.name.trim().length === 0 || !$scope.thread.message || $scope.thread.message.trim().length === 0) {
                        dialogService.showToast("Please Check Your Input - Something is Missing...");
                        return
                    }
                    $scope.step += 1;
                } else if (type==="createFile" || type==="createDocument") {
                    if (!$scope.uploadFile.file || !$scope.uploadFile.file.filename || $scope.uploadFile.file.filename.trim().length === 0) {
                        dialogService.showToast("Please Check Your Input - Something is Missing...");
                        return
                    }
                    $scope.step += 1;
                }
            }
        } else {
            if ($scope.step==1 && !$scope.activity.selectedProject) {
                dialogService.showToast("Please Check Your Input - Something is Missing...");
            } else if ($scope.step==2 && (!$scope.activity.name || $scope.activity.name.trim().length===0)) {
                dialogService.showToast("Please Check Your Input - Something is Missing...")
            } else {
                $scope.step+=1;
            }
        }
    };

    $scope.$on('$destroy', function() {
        listenerCleanFn();
        listenerTaskCreatedFb();
    });

    /*
        Update dashboard items list when user interactive with
    */
    var listenerCleanFn = $rootScope.$on("Dashboard-Update", function(event, data) {
        if (data.type==="thread") {
            $scope.myMessages.splice(data.index, 1);
        } if (data.type==="file" || data.type==="document") {
            $scope.myFiles.splice(data.index, 1);
        }
    });

    /*
        Change task due date to string and insert to tasks list
    */
    var listenerTaskCreatedFb = $rootScope.$on("DashBoard-Task-Created", function(event, data) {
        var taskDueDate = moment(data.dateEnd).format("YYYY-MM-DD");
        if (data.dateEnd) {
            if (moment(taskDueDate).isSame(moment().format("YYYY-MM-DD"))) {
                data.dueDate = "Today";
            } else if (moment(taskDueDate).isSame(moment().add(1, "days").format("YYYY-MM-DD"))) {
                data.dueDate = "Tomorrow";
            } else if (moment(taskDueDate).isSame(moment().subtract(1, "days").format("YYYY-MM-DD"))) {
                data.dueDate = "Yesterday";
            }
        }
        data.element.notifications = [];
        $scope.myTasks.push(data);
        renderTasksAndEventsToCalendar(true);
    });

    

    /*
        Get item index in items list
    */
    function getItemIndex(array, id) {
        return _.findIndex(array, function(item) {
            if (item._id) {
                return item._id.toString()===id.toString();
            }
        });
    };

    // socket section
    /*
        Receive socket when archived file
        Get file index then remove it from files list and update count number by -1
    */
    socket.on("file:archive", function(data) {
        var currentFileIndex=_.findIndex($scope.myFiles, function(t) {
            if (t.element.type==="file") {
                return t._id.toString()===data._id.toString();
            }
        });
        if (currentFileIndex !== -1) {
            $scope.myFiles.splice(currentFileIndex,1);
            $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "file", number: 1});
        }
    });

    /*
        Receive socket when archived document
        Get document index then remove it from documents list and update count number by -1
    */
    socket.on("document:archive", function(data) {
        var currentFileIndex=_.findIndex($scope.myFiles, function(t) {
            if (t.element.type==="document") {
                return t._id.toString()===data._id.toString();
            }
        });
        if (currentFileIndex !== -1) {
            $scope.myFiles.splice(currentFileIndex,1);
            $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "document", number: 1});
        }
    });

    /*
        Receive socket when archived thread
        Get thread index then remove it from threads list and update count number by -1
    */
    socket.on("thread:archive", function(data) {
        var currentThreadIndex=_.findIndex($scope.myMessages, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentThreadIndex !== -1) {
            $scope.myMessages.splice(currentThreadIndex, 1);
            $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "message", number: 1});
        }
    });

    /*
        Recevie socket when insert new item and current user hasn't read
        1. Get new item type
        2. Check if existed or not
            a. If existed then add count number by 1 and update count notitication of item
            b. If not then insert new item to list items type and increase count number by 1
    */
    socket.on("dashboard:new", function(data) {
        if (data.type==="thread") {
            var index = getItemIndex($scope.myMessages, data._id);
            if (index !== -1 && ($scope.myMessages[index] && $scope.myMessages[index].uniqId!=data.uniqId)) {
                if ($scope.myMessages[index].element.notifications.length===0) {
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "message", isAdd: true, number: $scope.myMessages.length});
                }
                $scope.myMessages[index].uniqId=data.uniqId;
                $scope.myMessages[index].element.notifications.push(data.newNotification);
            } else if (index === -1) {
                data.thread.element.notifications = [];
                data.thread.element.notifications.push(data.newNotification);
                if (data.user._id.toString()===$rootScope.currentUser._id.toString()) {
                    data.thread.element.notifications=[];
                }
                data.thread.uniqId=data.uniqId;
                $scope.myMessages.push(data.thread);
                $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "message", isAdd: true, number: $scope.myMessages.length});
            }
        } else if (data.type==="task") {
            var index = getItemIndex($scope.myTasks, data._id);
            if (index !== -1 && $scope.myTasks[index].uniqId!=data.uniqId && data.user._id.toString()!==$rootScope.currentUser._id.toString()) {
                $scope.myTasks[index].uniqId = data.uniqId;
                if ($scope.myTasks[index].__v===0) {
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", isAdd: true, number: 1});
                }
                $scope.myTasks[index].__v +=1;
            } else if (index===-1) {
                data.task.__v = 1;
                if (data.user._id.toString()===$rootScope.currentUser._id.toString()) {
                    data.task.element.notifications=[];
                }
                data.task.uniqId = data.uniqId;
                $scope.myTasks.push(data.task);
                $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", isAdd: true, number: 1});
            }
            renderTasksAndEventsToCalendar(true);
        } else if (data.type==="document") {
            if (data.file.element.type==="document") {
                var index = getItemIndex($scope.myDocuments, data.documentSet._id);
                if (index !== -1) {
                    $scope.myDocuments[index].__v +=1;
                    var fileIndex = _.findIndex($scope.myDocuments[index].documents, function(doc) {
                        return doc._id.toString()===data.file._id.toString();
                    });
                    if (fileIndex!==-1) {
                        $scope.myDocuments[index].documents[fileIndex].__v+=1;
                    } else if (fileIndex===-1) {
                        data.file.__v = 1;
                        $scope.myDocuments[index].documents.push(data.file);
                        $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "document", isAdd: true, number: 1});
                    }
                } else if (index === -1) {
                    data.documentSet.__v = 1;
                    data.file.__v = 1;
                    data.documentSet.documents.push(data.file);
                    $scope.myDocuments.push(data.documentset);
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "document", isAdd: true, number: 1});
                }
            }
        } else if (data.type==="file") {
            if (data.file.element.type==="file") {
                var index = getItemIndex($scope.myFiles, data._id);
                if (index !== -1 && $scope.myFiles[index].uniqId!=data.uniqId) {
                    $scope.myFiles[index].uniqId=data.uniqId;
                    $scope.myFiles[index].element.notifications.push(data.newNotification);
                    var notificationFile = _.filter($scope.myFiles, function(file) {
                        return file.element.type==="file";
                    });
                    if ($scope.myFiles[index].element.notifications.length===0) {
                        $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "file", isAdd: true, number: notificationFile.length});
                    }
                } else if (index === -1) {
                    data.file.element.notifications = [];
                    data.file.element.notifications.push(data.newNotification);
                    if (data.user._id.toString()===$rootScope.currentUser._id.toString()) {
                        data.file.element.notifications=[];
                    }
                    data.file.uniqId=data.uniqId;
                    $scope.myFiles.push(data.file);
                    var notificationFile = _.filter($scope.myFiles, function(file) {
                        return file.element.type==="file";
                    });
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "file", isAdd: true, number: notificationFile.length});
                }
            }
        }
    });
    // end socket section

    /*Show a toast modal*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    /*Close current open modal and set projects filter, selected project by default*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
        _.each($scope.projects, function(project) {
            project.select = false;
        });
        _.each($scope.projectFilterTags, function(project) {
            project.select = false;
        });
    };

    /*Mark the selected item as read*/
    $scope.markRead = function(item) {
        notificationService.markItemsAsRead({id: item._id}).$promise.then(function() {
            $scope.showToast("You Have Successfully Marked This Read.");
            item.element.limitNotifications = [];
            item.element.notifications = [];
        }, function(err){$scope.showToast("Error");});
    };

    /*Get all project members when create new item*/
    function getProjectMembers(id) {
        $scope.selectedProjectId = id;
        peopleService.getInvitePeople({id: id}).$promise.then(function(res) {
            $scope.projectMembers = $rootScope.getProjectMembers(res);
            
            if ($rootScope.isRemoveCurrentUser) {
                _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
            }
        });
    };

    /*Add project member to new item*/
    $scope.selectMember = function(index) {
        $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
    };

    /*Check if user is create new task via event detail*/
    if ($rootScope.selectedProjectId) {
        var index = _.findIndex($scope.projects, function(project) {
            return project._id.toString()===$rootScope.selectedProjectId;
        });
        if (index !== -1) {
            $scope.selectProject(index);
            // $scope.selectedProjectIndex = index;
            $rootScope.selectedProjectId = null;
        }
    }

    /*Select project for getting member of it's*/
    // $scope.$watch("selectedProjectIndex", function() {
    //     if ($scope.selectedProjectIndex) {
    //         getProjectMembers($scope.projects[$scope.selectedProjectIndex]._id);
    //     }
    // });

    // task section
    $scope.task = {
        members: [],
        dateStart: ($rootScope.selectedStartDate) ? $rootScope.selectedStartDate : new Date(),
        dateEnd: ($rootScope.selectedEndDate) ? $rootScope.selectedEndDate : new Date(),
        time: {}
    };
    if ($rootScope.selectedStartDate && $rootScope.selectedEndDate) {
        $scope.task.time = {
            start: $rootScope.selectedStartDate,
            end: $rootScope.selectedEndDate
        }
    }

    /*Change task due date to a text*/
    // angular.forEach($scope.myTasks, function(task) {
    //     var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
    //     if (task.dateEnd) {
    //         if (moment(taskDueDate).isSame(moment().format("YYYY-MM-DD"))) {
    //             task.dueDate = "Today";
    //         } else if (moment(taskDueDate).isSame(moment().add(1, "days").format("YYYY-MM-DD"))) {
    //             task.dueDate = "Tomorrow";
    //         } else if (moment(taskDueDate).isSame(moment().subtract(1, "days").format("YYYY-MM-DD"))) {
    //             task.dueDate = "Yesterday";
    //         }
    //     }
    // });

    /*
    Mark selected task as completed or un-completed
    1.If mark complete then set completed by current user and completed at now
    2.If mark uncomplete then set completed by null and completed at null
    Then remove current task from tasks list and update count number
    */
    // $scope.markComplete = function(task, index) {
    //     task.completed = !task.completed;
    //     if (task.completed) {
    //         task.completedBy = $rootScope.currentUser._id;
    //         task.editType = "complete-task";
    //         task.completedAt = new Date();
    //     } else {
    //         task.completedBy = null;
    //         task.editType = "uncomplete-task";
    //         task.completedAt = null;
    //     }
    //     taskService.update({id: task._id}, task).$promise.then(function(res) {
    //         $scope.showToast((res.completed)?"Task Has Been Marked Completed.":"Task Has Been Marked Incomplete.");
    //         notificationService.markItemsAsRead({id: res._id}).$promise.then(function() {
    //             $scope.myTasks.splice(index ,1);
    //             $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", number: 1});
    //         });
    //     }, function(err) {$scope.showToast("Error");});
    // };

    /*Show add new task modal*/
    // $scope.showNewTaskModal = function(event) {
    //     $rootScope.isRemoveCurrentUser = false;
    //     $mdDialog.show({
    //         targetEvent: event,
    //         controller: "dashboardCtrl",
    //         resolve: {
    //             myTasks: ["taskService", function(taskService) {
    //                 return taskService.myTask().$promise;
    //             }],
    //             myMessages: ["messageService", function(messageService) {
    //                 return messageService.myMessages().$promise;
    //             }],
    //             myFiles: ["fileService" ,function(fileService) {
    //                 return fileService.myFiles().$promise;
    //             }]
    //         },
    //         templateUrl: 'app/modules/dashboard/partials/project-task-new.html',
    //         parent: angular.element(document.body),
    //         clickOutsideToClose: false
    //     });
    // };

    /*
    Create new task if enter a valid form with selected project members
    When success call mixpanel that current user has created new task
    then call function listenerTaskCreatedFb
    */
    $scope.minDate = new Date();
    $scope.createNewTask = function(form) {
        if (form.$valid) {
            $scope.task.members = _.filter($scope.projectMembers, {select: true});
            $scope.task.type = "task-project";
            if ($scope.task.members.length > 0) {
                taskService.create({id: $scope.selectedProjectId}, $scope.task).$promise.then(function(res) {
                    $scope.closeModal();
                    $scope.showToast("New Task Created Successfully.");
                    
                    //Track New Task
                    mixpanel.identify($rootScope.currentUser._id);
                    mixpanel.track("New Task Created");

                    _.each($scope.projects, function(project) {
                        project.select = false;
                    });
                    $rootScope.$emit("DashBoard-Task-Created", res);
                }, function(err) {$scope.showToast("There Has Been An Error...");});
            } else {
                $scope.showToast("Please Select At Least One Assignee...");
                return false;
            }
        } else {
            $scope.showToast("There Has Been An Error...");
            return false;
        }
    };

    // start message section
    $scope.message = {};
    if ($rootScope.selectedMessage) {
        $scope.selectedThread = $rootScope.selectedMessage;
    }
    /*Show reply message modal with selected thread*/
    $scope.showReplyModal = function(event, message) {
        $rootScope.selectedMessage = message;
        $mdDialog.show({
            targetEvent: event,
            controller: "dashboardCtrl",
            resolve: {
                myTasks: ["taskService", function(taskService) {
                    return taskService.myTask().$promise;
                }],
                myMessages: ["messageService", function(messageService) {
                    return messageService.myMessages().$promise;
                }],
                myFiles: ["fileService" ,function(fileService) {
                    return fileService.myFiles().$promise;
                }],
                activities: ["activityService", function(activityService) {
                    return activityService.me({id: "me"}).$promise;
                }],
                myDocuments: ["documentService", function(documentService) {
                    return documentService.me({id: "me"}).$promise;
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/reply-message.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Show create new thread modal*/
    // $scope.showNewThreadModal = function(event) {
    //     $rootScope.isRemoveCurrentUser = true;
    //     $mdDialog.show({
    //         targetEvent: event,
    //         controller: "dashboardCtrl",
    //         resolve: {
    //             myTasks: ["taskService", function(taskService) {
    //                 return taskService.myTask().$promise;
    //             }],
    //             myMessages: ["messageService", function(messageService) {
    //                 return messageService.myMessages().$promise;
    //             }],
    //             myFiles: ["fileService" ,function(fileService) {
    //                 return fileService.myFiles().$promise;
    //             }]
    //         },
    //         templateUrl: 'app/modules/dashboard/partials/new-thread.html',
    //         parent: angular.element(document.body),
    //         clickOutsideToClose: false
    //     });
    // };

    /*
    Send a reply in selected thread
    Check if form has reply text or not
    If valid, send a reply then call mixpanel to track that current user has sent reply
    and update all notifications within selected thread as read
    When mark notifications as read success, subtract the count notification by 1
    and call function listenerCleanFn
    */
    $scope.sendMessage = function() {
        $scope.message.text = $scope.message.text.trim();
        if ($scope.message.text.length===0 || $scope.message.text === '') {
            $scope.showToast("Please Provide a Message to Send...");
            return;
        } else {
            messageService.sendMessage({id: $scope.selectedThread._id}, $scope.message).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Your Message Has Been Sent Successfully.");
                
                //Track Reply Sent
                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("Reply Sent");
                
                $scope.selectedThread = $rootScope.selectedMessage = res;
                notificationService.markItemsAsRead({id: res._id}).$promise.then(function() {
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "message", number: 1});
                    var currentThreadIndex = _.findIndex($scope.myMessages, function(message) {
                        return message._id.toString()===$scope.selectedThread._id.toString();
                    });
                    $rootScope.$emit("Dashboard-Update", {type: "thread", index: currentThreadIndex});
                });
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    // $scope.thread = {members: []};
    /*
    Add new thread if form is valid with selected project members then
    call mixpanel to track that current user has created new thread
    and go to created thread detail immedietly
    */
    // $scope.addNewThread = function(form) {
    //     if (form.$valid) {
    //         $scope.thread.members = _.filter($scope.projectMembers, {select: true});
    //         $scope.thread.type = "project-message";
    //         messageService.create({id: $scope.selectedProjectId},$scope.thread).$promise.then(function(res) {
    //             $scope.closeModal();
    //             $scope.showToast("New Message Thread Created Successfully.");
                
    //             //Track Message Thread Creation
    //             mixpanel.identify($rootScope.currentUser._id);
    //             mixpanel.track("New Message Thread Created");

    //             $rootScope.isRemoveCurrentUser = false;
    //             _.each($scope.projects, function(project) {
    //                 project.select = false;
    //             });
    //             $state.go("project.messages.detail", {id: res.project._id, messageId: res._id});
    //         }, function(err) {
    //             $scope.showToast("There Has Been An Error...")
    //         });
    //     } else {
    //         $scope.showToast("Error");
    //     }
    // };
    // end message section

    // start file section
    /*Open latest version of select file or document in new tab*/
    $scope.showViewFileModal = function(event, file) {
        if (file.element.type==="file") {
            var win = window.open(file.path, "_blank");
        } else {
            var win = window.open(_.last(file.fileHistory).link, "_blank");
        }
        win.focus();
    };

    /*Open create new file modal*/
    // $scope.showNewFileModal = function(event) {
    //     $rootScope.isRemoveCurrentUser = true;
    //     $mdDialog.show({
    //         targetEvent: event,
    //         controller: "dashboardCtrl",
    //         resolve: {
    //             myTasks: ["taskService", function(taskService) {
    //                 return taskService.myTask().$promise;
    //             }],
    //             myMessages: ["messageService", function(messageService) {
    //                 return messageService.myMessages().$promise;
    //             }],
    //             myFiles: ["fileService" ,function(fileService) {
    //                 return fileService.myFiles().$promise;
    //             }]
    //         },
    //         templateUrl: 'app/modules/dashboard/partials/new-file.html',
    //         parent: angular.element(document.body),
    //         clickOutsideToClose: false
    //     });
    // };
	
    /*Open create new document modal*/
    // $scope.showNewDocumentModal = function(event) {
    //     $rootScope.isRemoveCurrentUser = true;
    //     $mdDialog.show({
    //         targetEvent: event,
    //         controller: "dashboardCtrl",
    //         resolve: {
    //             myTasks: ["taskService", function(taskService) {
    //                 return taskService.myTask().$promise;
    //             }],
    //             myMessages: ["messageService", function(messageService) {
    //                 return messageService.myMessages().$promise;
    //             }],
    //             myFiles: ["fileService" ,function(fileService) {
    //                 return fileService.myFiles().$promise;
    //             }]
    //         },
    //         templateUrl: 'app/modules/dashboard/partials/new-document.html',
    //         parent: angular.element(document.body),
    //         clickOutsideToClose: false
    //     });
    // };

    /*Download selected file with file picker*/
    $scope.download = function() {
        filepicker.exportFile(
            {url: $scope.file.path, filename: $scope.file.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    };

    // $scope.uploadFile = {
    //     tags:[],
    //     members:[]
    // };

    // $scope.pickFile = pickFile;

    // $scope.onSuccess = onSuccess;

    // function pickFile(){
    //     filepickerService.pick(
    //         onSuccess
    //     );
    // };

    // function onSuccess(file){
    //     $scope.uploadFile.file = file;
    // };

    /*
    Create new file with valid form included project members, tags
    If success, call mixpanel to track current user has created new file
    and go to created file detail
    */
    // $scope.createNewFile = function(form) {
    //     if (form.$valid) {
    //         $scope.uploadFile.members = _.filter($scope.projectMembers, {select: true});
    //         $scope.uploadFile.tags = _.filter($scope.fileTags, {select: true});
    //         if ($scope.uploadFile.tags.length == 0) {
    //             $scope.showToast("Please Select At Least 1 Tag...");
    //         } else if ($scope.uploadFile.members.length == 0) {
    //             $scope.showToast("Please Select At Lease 1 Team Member...");
    //         } else if (!$scope.uploadFile.file) {
    //             $scope.showToast("Please Select A File");
    //             return;
    //         } else {
    //             $scope.uploadFile.type = "file";
    //             uploadService.upload({id: $scope.selectedProjectId}, $scope.uploadFile).$promise.then(function(res) {
    //                 $mdDialog.hide();
    //                 $scope.showToast("File Has Been Uploaded Successfully.");
                    
    //                 //Track New File
    //                 mixpanel.identify($rootScope.currentUser._id);
    //                 mixpanel.track("New File Created");

    //                 _.each($scope.fileTags, function(tag) {
    //                     tag.select = false;
    //                 });

    //                 _.each($scope.projects, function(project) {
    //                     project.select = false;
    //                 });

    //                 $rootScope.isRemoveCurrentUser = true;

    //                 $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
                    
    //             }, function(err) {
    //                 $scope.showToast("There Has Been An Error...");
    //             });
    //         }
    //     } else 
    //         $scope.showToast("Check your input again");
    // };
    // end file section
	
    /*Go to item detail*/
    $scope.openLocation = function(item, type) {
        if (type === "thread") 
            $state.go("project.messages.detail", {id: item.project._id, messageId: item._id});
        else if (type === "file") {
            $state.go("project.files.detail", {id: item.project._id, fileId: item._id});
        } else if (type === "document") {
            $state.go("project.documentation.detail", {id: item.project._id, documentId: item._id});
        }
    };

    // filter for thread
    $scope.searchThread = function(thread) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (thread.name.toLowerCase().indexOf($scope.name) > -1 || thread.name.indexOf($scope.name) > -1) {
                found = true
            }
            return found;
        } else if ($scope.recipient && $scope.recipient.length > 0) {
            var found = false;
            if (thread.members && thread.members.length > 0) {
                _.each(thread.members, function(member) {
                    if ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1)) {
                        found = true;
                    }
                });
            }
            if (thread.notMembers && thread.notMembers.length > 0) {
                _.each(thread.notMembers, function(email) {
                    if (email.toLowerCase().indexOf($scope.recipient) > -1) {
                        found = true;
                    }
                });
            }
            return found;
        } else if ($scope.reply && $scope.reply.length > 0) {
            var found = false;
            _.each(thread.messages, function(message) {
                if (message.text.toLowerCase().indexOf($scope.reply) > -1 || message.text.indexOf($scope.reply) > -1) {
                    found = true;
                }
            });
            return found;
        } else if ($scope.projectsFilter.length > 0) {
            _.each($scope.projectsFilter, function(project) {
                if (project._id.toString()===thread.project.toString()) {
                    found = true
                }
            });
            return found;
        } else {
            return true;
        }
    };

    // filter for task
    $scope.dueDate = [{text: "past", value: "past"}, {text: "today", value: "today"}, {text: "tomorrow", value: "tomorrow"}, {text: "this week", value: "thisWeek"}, {text: "next week", value: "nextWeek"}];
    $scope.assignStatus = [{text: "Assigned To Me", value: "toMe"}, {text: "Assigned To Others", value: "byMe"}];
    $scope.dueDateFilter = [];
    $scope.projectsFilter = ($rootScope.projectsDashboardFilter) ? $rootScope.projectsDashboardFilter : [];
    $scope.selectDueDate = function(dateEnd) {
        $scope.dateEnd = dateEnd;
        $scope.dueDateFilter = [];
    };

    $scope.selectFilterTag = function(index, type) {
        if (type === "status") {
            $scope.dueDateFilter = [];
            $scope.dateEnd = null;
            _.each($scope.dueDate, function(date) {
                date.select = false;
            });
            $scope.assignStatus[index].select = !$scope.assignStatus[index].select;
            if (index === 0) {
                $scope.assignStatus[1].select = false;
            } else {
                $scope.assignStatus[0].select = false;
            }
            if ($scope.assignStatus[index].select) {
                $scope.status = $scope.assignStatus[index].value;
            } else {
                $scope.status = null;
            }
        } else if (type === "project") {
            $scope.projectFilterTags[index].select = !$scope.projectFilterTags[index].select;
            if ($scope.projectFilterTags[index].select) {
                $scope.projectsFilter.push($scope.projectFilterTags[index]._id);
            } else {
                $scope.projectsFilter.splice(_.indexOf($scope.projectsFilter, $scope.projectFilterTags[index]._id), 1);
            }
            $rootScope.projectsDashboardFilter = $scope.projectsFilter;
        } else {
            $scope.status = null;
            _.each($scope.assignStatus, function(status) {
                status.select = false;
            });
            $scope.dueDate[index].select = !$scope.dueDate[index].select;
            if ($scope.dueDate[index].select) {
                $scope.dueDateFilter.push($scope.dueDate[index].value);
            } else {
                $scope.dueDateFilter.splice(_.indexOf($scope.dueDateFilter, $scope.dueDate[index].value), 1);
            }
        }
    };

    $scope.searchTask = function(task) {
        var found = false
        var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
        if ($scope.description && $scope.description.length > 0) {
            if (task.description.toLowerCase().indexOf($scope.description) > -1 || task.description.indexOf($scope.description) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.dateEnd && ($scope.status && $scope.status.length> 0)) { 
            if (moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(taskDueDate)) {
                if ($scope.status === "toMe" && _.findIndex(task.members, function(member) {
                    return member._id.toString()===$rootScope.currentUser._id.toString();
                }) !== -1) {
                    found = true;
                } else if ($scope.status === "byMe" && task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                    found = true;
                }
            }
            return found;
        } else if (($scope.status && $scope.status.length >0) && ($scope.dueDateFilter && $scope.dueDateFilter.length > 0)) {
            _.each($scope.dueDateFilter, function(filter) {
                switch (filter) {
                    case "today":
                        var today = moment(new Date()).format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(today)) {
                            if ($scope.status === "toMe" && _.findIndex(task.members, function(member) {
                                return member._id.toString()===$rootScope.currentUser._id.toString();
                            }) !== -1) {
                                found = true;
                            } else if ($scope.status==="byMe" && task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                                found = true;
                            }
                        }
                    break;

                    case "tomorrow":
                        var tomorrow = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(tomorrow)) {
                            if ($scope.status === "toMe" && _.findIndex(task.members, function(member) {
                                return member._id.toString()===$rootScope.currentUser._id.toString();
                            }) !== -1) {
                                found = true;
                            } else if ($scope.status==="byMe" && task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                                found = true;
                            }
                        }
                    break;

                    case "thisWeek":
                        var thisWeekStartDate = moment().startOf('week').format("YYYY-MM-DD");
                        var thisWeekEndDate = moment().endOf('week').format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(thisWeekStartDate) && moment(taskDueDate).isSameOrBefore(thisWeekEndDate)) {
                            if ($scope.status === "toMe" && _.findIndex(task.members, function(member) {
                                return member._id.toString()===$rootScope.currentUser._id.toString();
                            }) !== -1) {
                                found = true;
                            } else if ($scope.status==="byMe" && task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                                found = true;
                            }
                        }
                    break;

                    case "nextWeek":
                        var nextWeekStartDate = moment().startOf("week").add(7, "days").format("YYYY-MM-DD");
                        var nextWeekEndDay = moment().endOf("week").add(7, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(nextWeekStartDate) && moment(taskDueDate).isSameOrBefore(nextWeekEndDay)) {
                            if ($scope.status === "toMe" && _.findIndex(task.members, function(member) {
                                return member._id.toString()===$rootScope.currentUser._id.toString();
                            }) !== -1) {
                                found = true;
                            } else if ($scope.status==="byMe" && task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                                found = true;
                            }
                        }
                    break;

                    default:
                    break;
                }
            });
            return found;
        } else if ($scope.dateEnd) {
            if (moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(taskDueDate)) {
                found = true;
            }
            return found;
        } else if ($scope.status && $scope.status.length > 0) {
            if ($scope.status === "toMe") {
                found = (_.findIndex(task.members, function(member) {
                    if (member._id) {
                        return member._id.toString()===$rootScope.currentUser._id.toString();
                    }
                }) !== -1) ? true : false;
            } else if ($scope.status === "byMe") {
                if (task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                    found = true
                }
            }
            return found;
        } else if ($scope.dueDateFilter && $scope.dueDateFilter.length > 0) {
            _.each($scope.dueDateFilter, function(filter) {
                switch (filter) {
                    case "past":
                        var today = moment(new Date()).format("YYYY-MM-DD");
                        if (moment(taskDueDate).isBefore(today)) {
                            found = true;
                        }
                    break;

                    case "today":
                        var today = moment(new Date()).format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(today)) {
                            found = true;
                        }
                    break;

                    case "tomorrow":
                        var tomorrow = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSame(tomorrow)) {
                            found = true;
                        }
                    break;

                    case "thisWeek":
                        var thisWeekStartDate = moment().startOf('week').format("YYYY-MM-DD");
                        var thisWeekEndDate = moment().endOf('week').format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(thisWeekStartDate) && moment(taskDueDate).isSameOrBefore(thisWeekEndDate)) {
                            found = true;
                        }
                    break;

                    case "nextWeek":
                        var nextWeekStartDate = moment().startOf("week").add(7, "days").format("YYYY-MM-DD");
                        var nextWeekEndDay = moment().endOf("week").add(7, "days").format("YYYY-MM-DD");
                        if (moment(taskDueDate).isSameOrAfter(nextWeekStartDate) && moment(taskDueDate).isSameOrBefore(nextWeekEndDay)) {
                            found = true;
                        }
                    break;

                    default:
                    break;
                }
            });
            return found;
        } else if ($scope.projectsFilter.length > 0) {
            _.each($scope.projectsFilter, function(_id) {
                if (_id==task.project._id) 
                    found = true;
            });
            return found;
        } else
            return true;
    };

    // filter files
    $scope.selectChip = function(index, type) {
        if (type === "file")
            $scope.fileTags[index].select = !$scope.fileTags[index].select;
        else if (type === "document") 
            $scope.documentTags[index].select =!$scope.documentTags[index].select;
    };

    $scope.fileTags = [];
    _.each($rootScope.currentTeam.fileTags, function(tag) {
        $scope.fileTags.push({name: tag, select: false});
    });

    $scope.filterTags = [];
    $scope.selectFileFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.searchFile = function(file) {
        var found = false;
        if (($scope.name && $scope.name.length > 0) || ($scope.recipient && $scope.recipient.length > 0)) {
            if ($scope.name) {
                if (file.name.toLowerCase().indexOf($scope.name) > -1 || file.name.indexOf($scope.name) > -1) {
                    found = true;
                }
            } else if ($scope.recipient) {
                if (_.findIndex(file.members, function(member) {
                    return ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1));
                }) !== -1) {
                    found = true;
                } else if (_.findIndex(file.notMembers, function(member) {
                    return member.indexOf($scope.recipient) > -1;
                }) !== -1) {
                    found = true;
                }
            } 
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(file.tags, tag) !== -1) {
                    found = true;
                }
            })
            return found;
        } else if ($scope.projectsFilter.length > 0) {
            _.each($scope.projectsFilter, function(project) {
                if (project._id.toString()===file.project.toString()) {
                    found = true;
                }
            });
            return found;
        } else
            return true;
    };

    // filter for document
    // $scope.documentTags = [];
    // _.each($rootScope.currentTeam.documentTags, function(tag) {
    //     $scope.documentTags.push({name: tag, select: false});
    // });

    // $scope.filterTags = [];
    // $scope.selectDocumentFilterTag = function(tagName) {
    //     var tagIndex = _.indexOf($scope.filterTags, tagName);
    //     if (tagIndex !== -1) {
    //         $scope.filterTags.splice(tagIndex, 1);
    //     } else 
    //         $scope.filterTags.push(tagName);
    // };

    // $scope.filterDocument = function(document) {
    //     var found = false;
    //     if ($scope.name && $scope.name.length > 0) {
    //         if (document.name.toLowerCase().indexOf($scope.name) > -1 || document.name.indexOf($scope.name) > -1) {
    //             found = true;
    //         }
    //         return found;
    //     } else if ($scope.filterTags.length > 0) {
    //         _.each($scope.filterTags, function(tag) {
    //             if (_.indexOf(document.tags, tag) !== -1) {
    //                 found = true;
    //             }
    //         });
    //         return found;
    //     } else if ($scope.projectsFilter.length > 0) {
    //         _.each($scope.projectsFilter, function(project) {
    //             if (project._id.toString()===document.project.toString()) {
    //                 found = true;
    //             }
    //         });
    //         return found;
    //     } else 
    //         return true;
    // };

    $scope.selectDocumentSet = function(document) {
        $scope.selectedDocumentSet = document;
    };

    $scope.activity = {
        newMembers: [],
        date: {
            start: ($rootScope.selectedStartDate) ? $rootScope.selectedStartDate : new Date(),
            end: ($rootScope.selectedEndDate) ? $rootScope.selectedEndDate : new Date()
        }
    };
    $scope.createEvent = function(form) {
        if (form.$valid) {
            if (!$scope.activity.date.start || !$scope.activity.date.end) {
                dialogService.showToast("Please Enter Both a Start Date and an End Date...");
            } else {
                activityService.create({id: $scope.activity.selectedProject}, $scope.activity).$promise.then(function(res) {
                    dialogService.closeModal();
                    dialogService.showToast("Event Created Successfully.");
                    $scope.activities.push(res);
                    renderTasksAndEventsToCalendar(true);
                }, function(err) {
                    dialogService.showToast("There Has Been An Error...");
                });
            }
        } else {
            dialogService.showToast("Please Check Your Input - Something is Missing...");
        }
    };
});