angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $mdToast, $stateParams) {
	
	//Functions to handle New Tender Dialog.
	$scope.showNewTenderModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectTendersCtrl',
	      	templateUrl: 'app/modules/project/project-tenders/new/project-tenders-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.cancelNewTenderModal = function () {
		$mdDialog.cancel();
	};
	
	$scope.tendersFilters = ['Tender 1', 'Tender 2'];
	
});