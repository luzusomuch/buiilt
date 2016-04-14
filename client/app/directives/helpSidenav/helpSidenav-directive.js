'use strict';
angular.module('buiiltApp').directive('helpSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/helpSidenav/helpSidenav.html',
        controller: function($scope, $state) {
			$scope.$state = $state;
        }
    };
});