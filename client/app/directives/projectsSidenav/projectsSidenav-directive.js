'use strict';
angular.module('buiiltApp').directive('projectsSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/projectsSidenav/projectsSidenav.html',
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService, $state) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};

			$scope.$state = $state;

		    $scope.errors = {};
			
        }
    };
});