angular.module('buiiltApp').controller('projectTasksCtrl', function($scope, $timeout, $q, $mdDialog) {
	
	//Add a New Work Room to the Project
	$scope.createNewMessage = function() {
		console.log('createNewMessage function clicked');
		$mdDialog.hide();
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewTaskModal = function($event) {
	
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectTasksCtrl',
	      templateUrl: 'app/modules/project/project-tasks/new/project-tasks-new.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.cancelNewTaskModal = function() {
		$mdDialog.cancel();
	};
	
	//Placeholder set of filters to use for layout demo
	$scope.taskFilters = ['Task Description 1', 'Assignee 3'];
	
	//Placeholder Array of Workrooms to use for layout demo
	$scope.tasks = [
		{'description': 'Task Description Lorem Ipsum Dolor etc', 'assignee': 'John, Ken, Brett'},
		{'description': 'Task Description Lorem Ipsum Dolor etc', 'assignee': 'John, Ken'},
		{'description': 'Task Description Lorem Ipsum Dolor etc', 'assignee': 'John, Andy'}
	];
});