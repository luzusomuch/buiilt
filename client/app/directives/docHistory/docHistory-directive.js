'use strict';
angular.module('buiiltApp').directive('docHistory', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/docHistory/docHistory.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService, $state, $mdDialog) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
			
			$scope.$state = $state;

		    $scope.errors = {};
			
			
        }
    };
});