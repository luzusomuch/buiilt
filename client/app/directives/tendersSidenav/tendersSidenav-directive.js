'use strict';
angular.module('buiiltApp').directive('tendersSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/tendersSidenav/tendersSidenav.html',
        controller: function($scope, $rootScope, $state) {
            $scope.$state = $state;
            $scope.currentTeam = $rootScope.currentTeam;
        }
    }
});