angular.module('buiiltApp').service('dialogService', function($mdDialog, $mdToast) {
	this.closeModal = function() {
		$mdDialog.hide();
	};

    this.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
		
});