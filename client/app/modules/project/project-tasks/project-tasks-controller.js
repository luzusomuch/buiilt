angular.module('buiiltApp').controller('projectTasksCtrl', function($rootScope, $scope, $mdDialog, tasks, taskService, $mdToast, $stateParams, $state, peopleService, people, socket, notificationService) {
	$scope.tasks = tasks;
    function filterTaskDueDate(tasks) {
        var today = moment(new Date()).format("YYYY-MM-DD");
        var tomorrow = moment(new Date()).add(1, "day").format("YYYY-MM-DD");
        var yesterday = moment(new Date()).subtract(1, "day").format("YYYY-MM-DD");
        _.each(tasks, function(task) {
            var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
            if (!task.element.notificationType) {
                if (moment(taskDueDate).isSame(tomorrow)) {
                    task.element.dueClose = true;
                    task.element.due = "Tomorrow";
                } else if (moment(taskDueDate).isSame(today)) {
                    task.element.dueClose = true;
                    task.element.due = "Today";
                } else if (moment(taskDueDate).isSame(yesterday)) {
                    task.element.dueClose = true;
                    task.element.due = "Yesterday";
                }
            }
        });
    };
    filterTaskDueDate($scope.tasks);

	$scope.people = people;

    socket.on("task:new", function(data) {
        $scope.tasks.push(data);
        $scope.tasks = _.uniq($scope.tasks, "_id");
    });

    $rootScope.$on("Task.Inserted", function(event, data) {
        $scope.tasks.push(data);
        $scope.tasks = _.uniq($scope.tasks, "_id");
    });

    // filter section
    $scope.dueDate = [{text: "today", value: "today"}, {text: "tomorrow", value: "tomorrow"}, {text: "this week", value: "thisWeek"}, {text: "next week", value: "nextWeek"}];
    $scope.assignStatus = [{text: "to me", value: "toMe"}, {text: "byMe", value: "byMe"}];
    $scope.dueDateFilter = [];
    $scope.selectDueDate = function(dateEnd) {
        $scope.dateEnd = dateEnd;
        $scope.dueDateFilter = [];
    };

    $scope.selectFilterTag = function(index, type) {
        if (type === "status") {
            // $scope.dueDateFilter = [];
            // $scope.dateEnd = null;
            // _.each($scope.dueDate, function(date) {
            //     date.select = false;
            // });
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
        } else {
            // $scope.status = null;
            // _.each($scope.assignStatus, function(status) {
            //     status.select = false;
            // });
            $scope.dateEnd = null;
            $scope.dueDate[index].select = !$scope.dueDate[index].select;
            if ($scope.dueDate[index].select) {
                $scope.dueDateFilter.push($scope.dueDate[index].value);
            } else {
                $scope.dueDateFilter.splice(_.indexOf($scope.dueDateFilter, $scope.dueDate[index].value), 1);
            }
        }
    };

    $scope.search = function(task) {
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
        } else if (($scope.status && $scope.status.length > 0) && ($scope.dueDateFilter && $scope.dueDateFilter.length > 0)) {
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
                    return member._id.toString()===$rootScope.currentUser._id.toString();
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
        } else if ($scope.showCompletedTask) {
            found = (task.completed) ? true : false;
            return found;
        } else {
            found = (task.completed) ? false : true;
            return found;
        }
    };
    // end filter section

	$scope.showNewTaskModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: "projectTasksCtrl",
	      	resolve: {
		      	tasks: function(taskService, $stateParams) {
		        	return taskService.getProjectTask({id: $stateParams.id}).$promise;
		      	},
		      	people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
		    },
	      	templateUrl: 'app/modules/project/project-tasks/new/project-tasks-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};

	$scope.task = {};
	$scope.minDate = new Date();
	$scope.createNewTask = function(form) {
		if (form.$valid) {
		    $scope.task.members = _.filter($scope.projectMembers, {select: true});
			$scope.task.type = "task-project";
			if ($scope.task.members.length > 0) {
				taskService.create({id: $stateParams.id}, $scope.task).$promise.then(function(res) {
					$scope.cancelNewTaskModal();
					$scope.showToast("New Task Has Been Created Successfully.");
					
					//Track New Task
					mixpanel.identify($rootScope.currentUser._id);
					mixpanel.track("New Task Created");
					
                    $rootScope.$broadcast("Task.Inserted", res);
					$state.go("project.tasks.detail", {id: res.project._id, taskId: res._id});
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

	$scope.cancelNewTaskModal = function() {
		$mdDialog.cancel();
	};

	$scope.selectMember = function(index, type) {
		if (type === "member") {
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        }
	};

	$scope.showToast = function(value) {
	    $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
	};

	function getProjectMembers(id) {
	    $scope.projectMembers = [];
		_.each($rootScope.roles, function(role) {
			_.each($scope.people[role], function(tender){
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
		// _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
	};

	getProjectMembers($stateParams.id);
	
	$scope.taskFilters = ['Task Description 1', 'Assignee 3'];

    $scope.markComplete = function(task) {
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
                $rootScope.$broadcast("UpdateCountNumber", {type: "task", number: task.__v});
                task.__v = 0;
            });
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.markRead = function(item, type) {
        notificationService.markItemsAsRead({id: item._id}).$promise.then(function() {
            $scope.showToast("You Have Successfully Marked This Read.");
            $rootScope.$broadcast("UpdateCountNumber", {type: type, number: item.__v});
            item.element.notificationType = null;
            item.__v = 0;
        }, function(err){$scope.showToast("Error");});
    };
});