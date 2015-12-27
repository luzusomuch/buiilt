'use strict';
angular.module('buiiltApp').directive('dashboardSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/dashboardSidenav/dashboardSidenav.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService, $state) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};

		    projectService.get({'id': $state.params.projectId}).$promise.then(function(data) {
		        $scope.project = data;
		    });
			
			$scope.$state = $state;

		    $scope.errors = {};
			
        }
    };
});