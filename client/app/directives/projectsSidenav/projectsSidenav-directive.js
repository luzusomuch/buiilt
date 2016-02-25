'use strict';
angular.module('buiiltApp').directive('projectsSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/projectsSidenav/projectsSidenav.html',
        controller: function($scope, $rootScope, $state) {
			$scope.$state = $state;
            $scope.currentTeam = $rootScope.currentTeam;
        }
    };
});