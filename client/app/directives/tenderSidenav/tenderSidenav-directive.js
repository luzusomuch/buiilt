'use strict';
angular.module('buiiltApp').directive('tenderSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/tenderSidenav/tenderSidenav.html',
        scope: {
            tender: "="
        },
        controller: function($scope, $state) {
            $scope.$state = $state;
        }
    }
});