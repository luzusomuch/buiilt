angular.module('buiiltApp').controller('dashboardCtrl', function($scope, $timeout, $q, $state, projectService, packageService) {
	
	$scope.errors = {};
	$scope.success = {};
	$scope.user = {};

    projectService.get({'id': $state.params.projectId}).$promise.then(function(data) {
        $scope.project = data;
    });
	
    $scope.errors = {};
	
	//Placeholder Set of Filters to use for layout demo
	$scope.dashboardFilters = ['Project 1', 'Task description 1', 'Project 2'];
	
	//Placeholder Array of tasks to use for layout demo
	$scope.tasks = [
		{'name': 'Task 1','description': 'Description for Task 1'},
		{'name': 'Task 2','description': 'Description for Task 2'},
		{'name': 'Task 3','description': 'Description for Task 3'},
		{'name': 'Task 4','description': 'Description for Task 4'}
	];
	
	//Placeholder Array of messages to use for layout demo
	$scope.messages = [
		{'body': 'This is the body text of message 1','from': 'Bob Doe'},
		{'body': 'This is the body text of message 2','from': 'Jane Doe'},
		{'body': 'This is the body text of message 3','from': 'Bob Doe'},
		{'body': 'This is the body text of message 4','from': 'Jane Doe'}
	];
	
	//Placeholder Array of attachments to use for layout demo
	$scope.files = [
		{'name': 'File Name 1','revision': 'x of x'},
		{'name': 'File Name 2','revision': 'x of x'},
		{'name': 'File Name 3','revision': 'x of x'},
		{'name': 'File Name 4','revision': 'x of x'}
	];
	
	//Placeholder Array of documentation to use for layout demo
	$scope.documentation = [
		{'name': 'Document Name 1','revision': 'x of x'},
		{'name': 'Document Name 2','revision': 'x of x'},
		{'name': 'Document Name 3','revision': 'x of x'},
		{'name': 'Document Name 4','revision': 'x of x'}
	];
	
});