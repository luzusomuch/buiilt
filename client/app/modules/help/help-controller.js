angular.module('buiiltApp').controller('helpCtrl', function($rootScope, $scope, $timeout, $state, teamService, $mdToast, $mdDialog, authService, userService, stripe, projectService, $state, currentUser, dialogService) {
    $rootScope.title = "Help"
    
	$scope.inlinePlay = function(topicID) {
		$mdDialog.hide();
		inline_manual_player.activateTopic(topicID);
	};
	
	$scope.helpChatSupport = function(){
		Tawk_API.toggle();
	};
	
});