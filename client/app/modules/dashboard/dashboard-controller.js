angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, $mdDialog, $mdToast, projectService, myTasks, myMessages, myFiles, notificationService, taskService, peopleService, messageService, fileService, socket, uploadService) {
	$rootScope.title = "Dashboard";
	$scope.myTasks = myTasks;
	$scope.myMessages = myMessages;
	$scope.myFiles = myFiles;
    $scope.projects = [];
    _.each($rootScope.projects, function(project) {
        if (project.status==="waiting") {
            $scope.projects.push(project);
        }
    });
    $scope.projectFilterTags = angular.copy($scope.projects);
    $scope.currentUser = $rootScope.currentUser;
	$scope.showFilter = false;

    function filterAcknowledgeFiles(files) {
        _.each(files, function(file) {
            var latestActivity = {};
            _.each(file.activities, function(activity) {
                if (activity.type==="upload-file" || activity.type==="upload-reversion") {
                    latestActivity = activity;
                }
            });
            if (_.findIndex(latestActivity.acknowledgeUsers, function(user) {
                if (user._id && user.isAcknow) {
                    return user._id.toString()===$scope.currentUser._id.toString();
                }
            })!==-1) {
                latestActivity.isAcknowledge = true;
            } else {
                latestActivity.isAcknowledge = false;
            }
            file.latestActivity = latestActivity;
        });
    };
    // filterAcknowledgeFiles($scope.myFiles);

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
        sortTask($scope.myTasks);
    });

    function sortTask(tasks) {
        tasks.sort(function(a,b) {
            if (a.dateEnd < b.dateEnd) {
                return -1;
            } 
            if (a.dateEnd > b.dateEnd) {
                return 1;
            }
            return 0;
        });
    };
    sortTask($scope.myTasks);

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
            _.uniq(data.task.members, "_id");
            var index = getItemIndex($scope.myTasks, data._id);
            if (index !== -1 && $scope.myTasks[index].uniqId!=data.uniqId && data.user._id.toString()!==$rootScope.currentUser._id.toString()) {
                $scope.myTasks[index].uniqId = data.uniqId;
                $scope.myTasks[index].element.notifications.push(data.newNotification);
                var notificationTask = _.filter($scope.myTasks, function(task) {
                    return task.element.notifications.length > 0;
                });
                if ($scope.myTasks[index].element.notifications.length===0) {
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", isAdd: true, number: notificationTask.length});
                }
            } else if (index===-1) {
                data.task.element.notifications = [];
                data.task.element.notifications.push(data.newNotification);
                if (data.user._id.toString()===$rootScope.currentUser._id.toString()) {
                    data.task.element.notifications=[];
                }
                data.task.uniqId = data.uniqId;
                $scope.myTasks.push(data.task);
                var notificationTask = _.filter($scope.myTasks, function(task) {
                    return task.element.notifications.length > 0;
                });
                $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", isAdd: true, number: notificationTask.length});
            }
            sortTask($scope.myTasks);
        } else if (data.type==="document") {
            if (data.file.element.type==="document") {
                var index = getItemIndex($scope.myFiles, data._id);
                if (index !== -1 && $scope.myFiles[index].uniqId!=data.uniqId) {
                    $scope.myFiles[index].uniqId=data.uniqId;
                    $scope.myFiles[index].element.notifications.push(data.newNotification);
                    var notificationFile = _.filter($scope.myFiles, function(file) {
                        return file.element.type==="document";
                    });
                    if ($scope.myFiles[index].element.notifications.length===0) {
                        $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "document", isAdd: true, number: notificationFile.length});
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
                        return file.element.type==="document";
                    });
                    $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "document", isAdd: true, number: notificationFile.length});
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
            $scope.projectMembers = [];
            _.each($rootScope.roles, function(role) {
                _.each(res[role], function(tender){
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
                                        $scope.projectMembers.push(member);
                                    });
                                }
                            });
                            if (tender.tenderers[0]._id) {
                                tender.tenderers[0]._id.select = false;
                                $scope.projectMembers.push(tender.tenderers[0]._id);
                            } else {
                                $scope.projectMembers.push({email: tender.tenderers[0].email, select: false});
                            }
                        } else {
                            $scope.projectMembers.push(tender.tenderers[0]._id);
                            _.each(tender.tenderers, function(tenderer) {
                                if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                    _.each(tenderer.teamMember, function(member) {
                                        member.select = false;
                                        $scope.projectMembers.push(member);
                                    });
                                }
                            });
                        }
                    }
                });
            });
            if ($rootScope.isRemoveCurrentUser) {
                _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
            }
        });
    };

    /*Add project member to new item*/
    $scope.selectMember = function(index) {
        $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
    };

    /*Select project for getting member of it's*/
    $scope.selectProject = function($index) {
        _.each($scope.projects, function(project) {
            project.select = false;
        });
        $scope.projects[$index].select = !$scope.projects[$index].select;
        getProjectMembers($scope.projects[$index]._id);
    };

    // task section
    $scope.task = {members: []};
    if ($rootScope.dashboardEditTask) {
        $scope.task = $rootScope.dashboardEditTask;
        $scope.task.dateEnd = new Date($scope.task.dateEnd);
    }

    /*Change task due date to a text*/
    angular.forEach($scope.myTasks, function(task) {
        var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
        if (task.dateEnd) {
            if (moment(taskDueDate).isSame(moment().format("YYYY-MM-DD"))) {
                task.dueDate = "Today";
            } else if (moment(taskDueDate).isSame(moment().add(1, "days").format("YYYY-MM-DD"))) {
                task.dueDate = "Tomorrow";
            } else if (moment(taskDueDate).isSame(moment().subtract(1, "days").format("YYYY-MM-DD"))) {
                task.dueDate = "Yesterday";
            }
        }
    });

    /*
    Mark selected task as completed or un-completed
    1.If mark complete then set completed by current user and completed at now
    2.If mark uncomplete then set completed by null and completed at null
    Then remove current task from tasks list and update count number
    */
    $scope.markComplete = function(task, index) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedBy = $rootScope.currentUser._id;
            task.editType = "complete-task";
            task.completedAt = new Date();
        } else {
            task.completedBy = null;
            task.editType = "uncomplete-task";
            task.completedAt = null;
        }
        taskService.update({id: task._id}, task).$promise.then(function(res) {
            $scope.showToast((res.completed)?"Task Has Been Marked Completed.":"Task Has Been Marked Incomplete.");
            notificationService.markItemsAsRead({id: res._id}).$promise.then(function() {
                $scope.myTasks.splice(index ,1);
                $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: "task", number: 1});
            });
        }, function(err) {$scope.showToast("Error");});
    };

    /*Show edit task modal with selected task*/
    $scope.showEditTaskModal = function(event, task) {
        $rootScope.dashboardEditTask = task;
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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/edit-task.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Show add new task modal*/
    $scope.showNewTaskModal = function(event) {
        $rootScope.isRemoveCurrentUser = false;
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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/project-task-new.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

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
                    $scope.showToast("New Task Has Been Created Successfully.");
                    
                    //Track New Task
                    mixpanel.identify($rootScope.currentUser._id);
                    mixpanel.track("New Task Created");

                    _.each($scope.projects, function(project) {
                        project.select = false;
                    });
                    $rootScope.$emit("DashBoard-Task-Created", res);
                }, function(err) {$scope.showToast("There Has Been An Error...");});
            } else {
                $scope.showToast("Please Select At Least 1 Assignee...");
                return false;
            }
        } else {
            $scope.showToast("There Has Been An Error...");
            return false;
        }
    };

    /*Edit selected task when entered valid form*/
    $scope.editTaskDetail = function(form) {
        if (form.$valid) {
            $scope.task.editType = "edit-task";
            taskService.update({id: $scope.task._id}, $scope.task).$promise.then(function(res) {
                $rootScope.dashboardEditTask = null;
                $scope.showToast("Task Has Been Updated Successfully.");
                $scope.closeModal();
            }, function(err) {
                $scope.showToast("There Has Been An Error...");
                delete task.editType;
            });
        } else {
            $scope.showToast("There Has Been An Error...");
            return;
        }
    };
    // end task section

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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/reply-message.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };
    
    $scope.showNewThreadModal = function(event) {
        $rootScope.isRemoveCurrentUser = true;
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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/new-thread.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.sendMessage = function() {
        $scope.message.text = $scope.message.text.trim();
        if ($scope.message.text.length===0 || $scope.message.text === '') {
            $scope.showToast("Please check your message");
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

    $scope.thread = {members: []};
    $scope.addNewThread = function(form) {
        if (form.$valid) {
            $scope.thread.members = _.filter($scope.projectMembers, {select: true});
            $scope.thread.type = "project-message";
            messageService.create({id: $scope.selectedProjectId},$scope.thread).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("New Message Thread Created Successfully.");
                
                //Track Message Thread Creation
                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("New Message Thread Created");

                $rootScope.isRemoveCurrentUser = false;
                _.each($scope.projects, function(project) {
                    project.select = false;
                });
                $state.go("project.messages.detail", {id: res.project._id, messageId: res._id});
            }, function(err) {
                $scope.showToast("There Has Been An Error...")
            });
        } else {
            $scope.showToast("Error");
        }
    };
    // end message section

    // start file section
    $scope.showViewFileModal = function(event, file) {
        // $rootScope.selectedFile = file;
        // $mdDialog.show({
        //     targetEvent: event,
        //     controller: "dashboardCtrl",
        //     resolve: {
        //         myTasks: function(taskService) {
        //             return taskService.myTask().$promise;
        //         },
        //         myMessages: function(messageService) {
        //             return messageService.myMessages().$promise;
        //         },
        //         myFiles: function(fileService) {
        //             return fileService.myFiles().$promise;
        //         }
        //     },
        //     templateUrl: 'app/modules/dashboard/partials/view-file.html',
        //     parent: angular.element(document.body),
        //     clickOutsideToClose: false
        // });
        if (file.element.type==="file") {
            var win = window.open(file.path, "_blank");
        } else {
            var win = window.open(_.last(file.fileHistory).link, "_blank");
        }
        win.focus();
    };

    $scope.showNewFileModal = function(event) {
        $rootScope.isRemoveCurrentUser = true;
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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/new-file.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };
	
    $scope.showNewDocumentModal = function(event) {
        $rootScope.isRemoveCurrentUser = true;
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
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/new-document.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    if ($rootScope.selectedFile) {
        $scope.file = $rootScope.selectedFile;
        $scope.latestActivity = {};
        _.each($scope.file.activities, function(activity) {
            if (activity.type==="upload-file" || activity.type==="upload-reversion") {
                $scope.latestActivity = activity;
            }
        });
        $scope.latestActivity.isAcknowledge = false;
        if (_.findIndex($scope.latestActivity.acknowledgeUsers, function(user) {
            if (user._id && user.isAcknow) {
                return user._id.toString()===$scope.currentUser._id.toString();
            }
        })!==-1) {
            $scope.latestActivity.isAcknowledge = true;
        }
    }

    $scope.download = function() {
        filepicker.exportFile(
            {url: $scope.file.path, filename: $scope.file.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    };

    $scope.sendAcknowledgement = function(file) {
        fileService.acknowledgement({id: file._id, activityId: file.latestActivity._id}).$promise.then(function(res) {
            $scope.showToast("Acknowledgement Has Been Sent Successfully.");
            $scope.closeModal();
            notificationService.markItemsAsRead({id: file._id}).$promise.then(function() {
                $rootScope.$emit("DashboardSidenav-UpdateNumber", {type: file.element.type, number: 1});
                var currentIndex = _.findIndex($scope.myFiles, function(f) {
                    return f._id.toString()===file._id.toString();
                });
                $rootScope.$emit("Dashboard-Update", {type: file.element.type, index: currentIndex});
            });
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.uploadFile = {
        tags:[],
        members:[]
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            // add max files for multiple pick
            // {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadFile.file = file;
    };

    $scope.createNewFile = function(form) {
        if (form.$valid) {
            $scope.uploadFile.members = _.filter($scope.projectMembers, {select: true});
            $scope.uploadFile.tags = _.filter($scope.fileTags, {select: true});
            if ($scope.uploadFile.tags.length == 0) {
                $scope.showToast("Please Select At Least 1 Tag...");
            } else if ($scope.uploadFile.members.length == 0) {
                $scope.showToast("Please Select At Lease 1 Team Member...");
            } else if (!$scope.uploadFile.file) {
                $scope.showToast("Please Select A File");
                return;
            } else {
                $scope.uploadFile.type = "file";
                uploadService.upload({id: $scope.selectedProjectId}, $scope.uploadFile).$promise.then(function(res) {
                    $mdDialog.hide();
                    $scope.showToast("File Has Been Uploaded Successfully.");
                    
                    //Track New File
                    mixpanel.identify($rootScope.currentUser._id);
                    mixpanel.track("New File Created");

                    _.each($scope.fileTags, function(tag) {
                        tag.select = false;
                    });

                    _.each($scope.projects, function(project) {
                        project.select = false;
                    });

                    $rootScope.isRemoveCurrentUser = true;

                    $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
                    
                }, function(err) {
                    $scope.showToast("There Has Been An Error...");
                });
            }
        } else 
            $scope.showToast("Check your input again");
    };
    // end file section
	
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
    $scope.documentTags = [];
    _.each($rootScope.currentTeam.documentTags, function(tag) {
        $scope.documentTags.push({name: tag, select: false});
    });

    $scope.filterTags = [];
    $scope.selectDocumentFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.filterDocument = function(document) {
        var found = false;
        if ($scope.name && $scope.name.length > 0) {
            if (document.name.toLowerCase().indexOf($scope.name) > -1 || document.name.indexOf($scope.name) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(document.tags, tag) !== -1) {
                    found = true;
                }
            });
            return found;
        } else if ($scope.projectsFilter.length > 0) {
            _.each($scope.projectsFilter, function(project) {
                if (project._id.toString()===document.project.toString()) {
                    found = true;
                }
            });
            return found;
        } else 
            return true;
    };
});