angular.module('buiiltApp').service('dialogService', function($mdDialog, $mdToast, $rootScope) {
	this.closeModal = function() {
		$mdDialog.cancel();
        $rootScope.selectedStartDate = null;
	};

    this.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
		
});