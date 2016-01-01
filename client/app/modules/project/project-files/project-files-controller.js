angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $q, $mdDialog) {
	
	//Add a New Work Room to the Project
	$scope.createNewMessage = function() {
		console.log('createNewMessage function clicked');
		$mdDialog.hide();
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewFileModal = function($event) {
	
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectFilesCtrl',
	      templateUrl: 'app/modules/project/project-files/new/project-files-new.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.cancelNewFileModal = function() {
		$mdDialog.cancel();
	};
	
	//Placeholder set of filters to use for layout demo
	$scope.filesFilters = ['Room1', 'Room2'];
	
	//Placeholder Array of Workrooms to use for layout demo
	$scope.files = [
		{'name': 'Contract', 'version': 'x of x'},
		{'name': 'Variation', 'version': 'x of x'},
		{'name': 'Invoice', 'version': 'x of x'}
	];
});