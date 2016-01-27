angular.module('buiiltApp').controller('projectTasksCtrl', function($rootScope, $scope, $mdDialog, tasks, taskService, $mdToast, $stateParams, $state, peopleService, people) {
	_.each(tasks, function(task) {
		task.members.push(task.owner);
		_.remove(task.members, {_id: $rootScope.currentUser._id});
	});
	$scope.tasks = tasks;
	$scope.search = false;
	$scope.results = [];
	$scope.people = people;
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
            if (!$scope.task.isSelectTenderer) 
			    $scope.task.members = _.filter($scope.projectMembers, {select: true});
            else if ($scope.task.isSelectTenderer) 
                $scope.task.members = _.filter($scope.tenderers, {select: true});
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
            $scope.task.isSelectTenderer = false;
            _.each($scope.tenderers, function(tenderer) {
                tenderer.select = false;
            });
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        } else {
            $scope.task.isSelectTenderer = true;
            _.each($scope.projectMembers, function(member) {
                member.select = false;
            });
            _.each($scope.tenderers, function(tenderer) {
                tenderer.select = false;
            });
            $scope.tenderers[index].select = !$scope.tenderers[index].select;
        }
	};

	$scope.showToast = function(value) {
	    $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
	};

	function getProjectMembers(id) {
	    $scope.projectMembers = [];
        $scope.tenderers = [];
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
				} else {
                    if (tender.inviter._id.toString()===$rootScope.currentUser._id.toString()) {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id) {
                                $scope.tenderers.push(tenderer._id);
                            } else {
                                $scope.tenderers.push({email: tenderer.email});
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