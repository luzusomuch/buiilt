'use strict';
angular.module('buiiltApp').directive('relatedItems', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/relatedItems/relatedItems.html',
        scope:{
            tender:'='
        },
        controller: function($scope, $rootScope, $location, userService, projectService, $state, $mdDialog) {
            $scope.errors = {};
            $scope.success = {};
			
			$scope.$state = $state;

			$scope.showRelatedMessageModal = function ($event) {
				$mdDialog.show({
				  targetEvent: $event,
			      controller: 'projectMessagesCtrl',
			      templateUrl: 'app/modules/project/project-messages/detail/project-messages-riWindow.html',
			      parent: angular.element(document.body),
			      clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTeamMemberModal = function ($event) {
				$mdDialog.show({
				  targetEvent: $event,
			      controller: 'projectTeamCtrl',
			      templateUrl: 'app/modules/project/project-team/detail/project-teamMember-riWindow.html',
			      parent: angular.element(document.body),
			      clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedFilesModal = function ($event) {
				$mdDialog.show({
				  targetEvent: $event,
			      controller: 'projectFilesCtrl',
			      templateUrl: 'app/modules/project/project-files/detail/project-files-riWindow.html',
			      parent: angular.element(document.body),
			      clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTasksModal = function ($event) {
				$mdDialog.show({
				  targetEvent: $event,
			      controller: 'projectTasksCtrl',
			      templateUrl: 'app/modules/project/project-tasks/detail/project-tasks-riWindow.html',
			      parent: angular.element(document.body),
			      clickOutsideToClose: false
			    });
			};
			
			
        }
    };
});