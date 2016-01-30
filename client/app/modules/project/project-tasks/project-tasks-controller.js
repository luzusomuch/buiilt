angular.module('buiiltApp').controller('projectTasksCtrl', function($rootScope, $scope, $mdDialog, tasks, taskService, $mdToast, $stateParams, $state, peopleService, people) {
	_.each(tasks, function(task) {
		task.members.push(task.owner);
		_.remove(task.members, {_id: $rootScope.currentUser._id});
	});
	$scope.tasks = tasks;
	$scope.people = people;

    // filter section
    $scope.dueDate = [{text: "today", value: "today"}, {text: "tomorrow", value: "tomorrow"}, {text: "this week", value: "thisWeek"}, {text: "next week", value: "nextWeek"}];
    $scope.assignStatus = [{text: "to me", value: "toMe"}, {text: "byMe", value: "byMe"}];
    $scope.selectDueDate = function(dateEnd) {
        $scope.dateEnd = dateEnd;
        $scope.dueDateFilter = null;
    };

    $scope.selectFilterTag = function(index, type) {
        _.each($scope.dueDate, function(date) {
            date.select = false;
        });
        _.each($scope.assignStatus, function(status) {
            status.select = false;
        });
        if (type === "status") {
            $scope.assignStatus[index].select = !$scope.assignStatus[index].select;
            $scope.status = $scope.assignStatus[index].value;
        } else {
            $scope.dueDate[index].select = !$scope.dueDate[index].select;
            $scope.dueDateFilter = $scope.dueDate[index].value;
        }
    };

    $scope.search = function(task) {
        var found = false
        var taskDueDate = moment(task.dateEnd).format("YYYY-MM-DD");
        if ($scope.description && $scope.description.length > 0) {
            if (task.description.toLowerCase().indexOf($scope.description) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.dateEnd) {
            if (moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(taskDueDate)) {
                found = true;
            }
            return found;
        } else if ($scope.status && $scope.status.length > 0) {
            console.log($scope.status);
            if ($scope.status === "toMe") {
                console.log("[DEBUG TO ME]");
                found = (_.findIndex(task.members, function(member) {
                    console.log(member._id, $rootScope.currentUser._id);
                    return member._id.toString()===$rootScope.currentUser._id.toString();
                }) !== -1) ? true : false;
            } else if ($scope.status === "byMe") {
                console.log("[DEBUG BY ME]");
                if (task.owner._id.toString()===$rootScope.currentUser._id.toString()) {
                    found = true
                }
            }
            return found;
        } else if ($scope.dueDateFilter && $scope.dueDateFilter.length > 0) {
            switch ($scope.dueDateFilter) {
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
            return found;
        } else
            return true;
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
	$scope.createNewMessage = function(form) {
		if (form.$valid) {
		    $scope.task.members = _.filter($scope.projectMembers, {select: true});
			$scope.task.type = "task-project";
			if ($scope.task.members.length > 0) {
				taskService.create({id: $stateParams.id}, $scope.task).$promise.then(function(res) {
					$scope.cancelNewTaskModal();
					$scope.showToast("Add new task successfully.");
					$state.go("project.tasks.detail", {id: res.project, taskId: res._id});
				}, function(err) {$scope.showToast("Error");});
			} else {
				$scope.showToast("Please select at least 1 invitee");
				return false;
			}
		} else {
			$scope.showToast("Please check your input again");
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
	    $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
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
		_.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
	};

	getProjectMembers($stateParams.id);
	
	$scope.taskFilters = ['Task Description 1', 'Assignee 3'];
});