'use strict';
angular.module('buiiltApp').directive('backendSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/backendSidenav/backendSidenav.html',
        controller: function($scope, $rootScope, $location, $state) {
            $scope.$state = $state;
        }
    };
});