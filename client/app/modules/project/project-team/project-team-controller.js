angular.module('buiiltApp').controller('projectTeamCtrl', function($scope, $timeout, $q, $mdDialog) {
	
	//Function to Invite a Team New Member to the Project
	$scope.inviteNewTeamMember = function(){
		console.log('inviteNewTeamMember function was clicked');
		$mdDialog.hide();
	};
	
	//Functions to handle Invite Team Dialog.
	$scope.showInviteTeamModal = function($event) {
	
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectTeamCtrl',
	      templateUrl: 'app/modules/project/project-team/new/project-team-new.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.cancelInviteTeamModal = function () {
		$mdDialog.cancel();
	};
	
	//Placeholder Set of Filters to use for layout demo
	$scope.teamNames = ['Bob', 'Jane', 'Tmart'];
	
	//Placeholder Array of Team Members to use for layout demo
	$scope.teamMembers = [
		{'name': 'John Condon', 'role': 'Builder'},
		{'name': 'Myles Condon', 'role': 'Employee'},
		{'name': 'Ken Van Bran', 'role': 'Architect'},
		{'name': 'Brett Church', 'role': 'Architect'},
		{'name': 'Jack Lock', 'role': 'Home Owner'},
		{'name': 'Andy Romee', 'role': 'Consultant'}
	];
	
});