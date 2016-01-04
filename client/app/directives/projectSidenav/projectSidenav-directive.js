'use strict';
angular.module('buiiltApp').directive('projectSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/projectSidenav/projectSidenav.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, userService, projectService, $state, $timeout) {
            $scope.errors = {};
            $scope.success = {};
            $scope.$state = $state;
                     
        }
    };
});