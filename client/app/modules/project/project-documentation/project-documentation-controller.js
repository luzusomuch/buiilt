angular.module('buiiltApp').controller('projectDocumentationCtrl', function($scope, $timeout, $q, $mdDialog) {
	
	//Add a New Document to the Project
	$scope.addNewDocument = function(){
		console.log('addNewDocument function was clicked');
		$mdDialog.hide();
	};
	
	
	//Functions to handle New Documentation Modal.
	$scope.showNewDocumentModal = function($event) {
	
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectDocumentationCtrl',
	      templateUrl: 'app/modules/project/project-documentation/new/project-documentation-new.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.cancelNewDocumentModal = function(){
		$mdDialog.cancel();
	};
	
	//Placeholder set of filters to use for layout demo
	$scope.docTypes = [];
	
	//Placeholder Array of Documents to use for layout demo
	$scope.documentation = [
		{'name': 'Lower Ground Floor Plan','revision': '3 of 3'},
		{'name': 'Ground Floor Plan','revision': '7 of 7'},
		{'name': 'Landscape Plan','revision': '1 of 1'},
		{'name': 'Stormwater Plan','revision': '2 of 2'}
	];
	
});