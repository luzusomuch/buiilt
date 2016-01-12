angular.module('buiiltApp').controller('projectTasksCtrl', function($rootScope, $scope, $mdDialog, tasks, taskService, $mdToast, $stateParams, $state, peopleService) {
	_.each(tasks, function(task) {
		task.members.push(task.owner);
		_.remove(task.members, {_id: $rootScope.currentUser._id});
	});
	$scope.tasks = tasks;
	$scope.search = false;
	$scope.results = [];
	
	$scope.showNewTaskModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: "projectTasksCtrl",
	      	resolve: {
		      	tasks: function(taskService, $stateParams) {
		        	return taskService.getProjectTask({id: $stateParams.id}).$promise;
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
			$scope.task.members = _.filter($scope.membersList, {select: true});
			$scope.task.type = "task-project";
			if ($scope.task.members.length > 0) {
				taskService.create({id: $stateParams.id}, $scope.task).$promise.then(function(res) {
					$scope.cancelNewTaskModal();
					$scope.showToast("Add new task successfully.");
					$state.go("project.tasks.detail", {id: res.projet, taskId: res._id});
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

	$scope.selectMember = function(index) {
		$scope.membersList[index].select = !$scope.membersList[index].select;
	};

	$scope.showToast = function(value) {
	    $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
	};

	function getProjectMembers(id) {
	    $scope.membersList = [];
	    peopleService.getInvitePeople({id: id}).$promise.then(function(people) { 
	        if ($rootScope.currentUser.isLeader) {
	            _.each($rootScope.roles, function(role) {
	                _.each(people[role], function(tender) {
	                    if (tender.hasSelect) {
	                        var winnerTenderer = tender.tenderers[0];
	                        if (winnerTenderer._id) {
	                            winnerTenderer._id.select = false;
	                            $scope.membersList.push(winnerTenderer._id);
	                        } else if (winnerTenderer.email) {
	                            $scope.membersList.push({email: winnerTenderer.email, type: role, select: false});
	                        }
	                    }
	                    // get employees list
	                    var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
	                        if (tenderer._id) {
	                            return tenderer._id._id == $rootScope.currentUser._id;
	                        }
	                    });
	                    if (currentTendererIndex !== -1) {
	                        var currentTenderer = tender.tenderers[currentTendererIndex];
	                        _.each(currentTenderer.teamMember, function(member) {
	                            member.select = false;
	                            $scope.membersList.push(member);
	                        });
	                    }
	                });
	            });
	        } else {
	            $scope.membersList = $rootScope.currentTeam.leader;
	            _.each($rootScope.currentTeam.member, function(member) {
	                $scope.membersList.push(member);
	            });
	        }
	        // get unique member 
	        $scope.membersList = _.uniq($scope.membersList, "_id");

	        // remove current user from the members list
	        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
	        console.log($scope.membersList);
	    });
	};

	getProjectMembers($stateParams.id);
	
	$scope.taskFilters = ['Task Description 1', 'Assignee 3'];
});