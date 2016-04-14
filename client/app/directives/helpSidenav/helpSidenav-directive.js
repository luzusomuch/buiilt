'use strict';
angular.module('buiiltApp').directive('helpSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/helpSidenav/helpSidenav.html',
        controller: function($scope, $state) {
			$scope.$state = $state;
			
			$scope.inlinePlay = function(topicID) {
				$mdDialog.hide();
				inline_manual_player.activateTopic(topicID);
			};
			
			$scope.helpChatSupport = function(){
				Tawk_API.toggle();
			};
			
        }
    };
});