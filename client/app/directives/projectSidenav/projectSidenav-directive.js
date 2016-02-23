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
            $scope.showTeamMenu = false;

            $rootScope.$on("UpdateCountNumber", function(event, type) {
                if (type==="task") 
                    $scope.project.element.totalTasks = 0;
            });
        }
    };
});