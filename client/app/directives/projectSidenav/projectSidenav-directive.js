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

            $rootScope.$on("UpdateCountNumber", function(event, data) {
                if (data.type==="task") 
                    $scope.project.element.totalTasks = $scope.project.element.totalTasks - data.number;
                else if (data.type==="message") {
                    $scope.project.element.totalMessages = $scope.project.element.totalMessages - data.number;
                } else if (data.type==="file") {
                    $scope.project.element.totalFiles = $scope.project.element.totalFiles - data.number;
                } else if (data.type==="document") {
                    $scope.project.element.totalDocuments = $scope.project.element.totalDocuments - data.number;
                }
            });
        }
    };
});