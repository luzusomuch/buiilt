'use strict';
angular.module('buiiltApp').directive('relatedItems', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/relatedItems/relatedItems.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService, $state) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
			
			$scope.$state = $state;

		    $scope.errors = {};
			
        }
    };
});