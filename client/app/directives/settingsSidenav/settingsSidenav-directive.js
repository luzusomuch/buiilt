'use strict';
angular.module('buiiltApp').directive('settingsSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/settingsSidenav/settingsSidenav.html',
        controller: function($scope, $state) {
			$scope.$state = $state;
        }
    };
});