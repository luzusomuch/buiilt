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
                else if (type==="message") {
                    $scope.project.element.totalMessages = 0;
                } else if (type==="file") {
                    $scope.project.element.totalFiles = 0;
                } else if (type==="document") {
                    $scope.project.element.totalDocuments = 0;
                }
            });
        }
    };
});