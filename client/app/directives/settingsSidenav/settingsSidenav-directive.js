'use strict';
angular.module('buiiltApp').directive('settingsSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/settingsSidenav/settingsSidenav.html',
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService, $state) {
			$scope.$state = $state;
        }
    };
});