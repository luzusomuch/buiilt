angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $q, $mdDialog) {
	
	//Add a New Work Room to the Project
	$scope.createNewMessage = function() {
		console.log('createNewMessage function clicked');
		$mdDialog.hide();
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewMessageModal = function($event) {
	
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectMessagesCtrl',
	      templateUrl: 'app/modules/project/project-messages/new/project-messages-new.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.cancelNewMessageModal = function() {
		$mdDialog.cancel();
	};
	
	//Placeholder set of filters to use for layout demo
	$scope.messageNames = ['Room1', 'Room2'];
	
	//Placeholder Array of Workrooms to use for layout demo
	$scope.messages = [
		{'name': 'Contract signing', 'members': 'John, Ken, Brett'},
		{'name': 'Variation', 'members': 'John, Ken'},
		{'name': 'Mobilise on site', 'members': 'John, Andy'}
	];
});