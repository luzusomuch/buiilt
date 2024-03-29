'use strict';
angular.module('buiiltApp').directive('projectSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/projectSidenav/projectSidenav.html',
        scope:{
            project:'=',
            tenders: "="
        },
        controller: function($scope, $rootScope, userService, projectService, $state, $timeout, socket) {
            $scope.errors = {};
            $scope.success = {};
            $scope.$state = $state;
            $scope.showTeamMenu = false;

            function checkShowTendersModule() {
                if (($scope.tenders[0] && $scope.tenders[0].owner._id==$rootScope.currentUser._id)||$scope.project.projectManager._id==$rootScope.currentUser._id) 
                    return true;
                else
                    return false;
            };

            $scope.showTendersModule = checkShowTendersModule();

            var listenerCleanFn = $rootScope.$on("UpdateCountNumber", function(event, data) {
                if (data.type==="task") 
                    $scope.project.element.totalTasks = (data.isAdd) ? $scope.project.element.totalTasks+1 : $scope.project.element.totalTasks - data.number;
                else if (data.type==="message") {
                    $scope.project.element.totalMessages = (data.isAdd) ? $scope.project.element.totalMessages+1 :  $scope.project.element.totalMessages - data.number;
                } else if (data.type==="file") {
                    $scope.project.element.totalFiles = (data.isAdd) ? $scope.project.element.totalFiles+1 :  $scope.project.element.totalFiles - data.number;
                } else if (data.type==="document") {
                    if (data.isAdd) {
                        $scope.project.element.totalDocuments = $scope.project.element.totalDocuments+1;
                    } else if (data.isList) {
                        $scope.project.element.totalDocuments = data.number;
                    } else {
                        $scope.project.element.totalDocuments = $scope.project.element.totalDocuments - data.number;
                    }
                }
            });

            $scope.$on('$destroy', function() {
                listenerCleanFn();
            });

            socket.on("file:new", function(data) {
                $scope.project.element.totalFiles = $scope.project.element.totalFiles + 1;
            });
            // socket.on("thread:new", function(data) {
            //     $scope.project.element.totalMessages = $scope.project.element.totalMessages +1;
            // });
            // socket.on("task:new", function(data) {
            //     $scope.project.element.totalTasks = $scope.project.element.totalTasks +1;
            // });

            socket.on("file:archive", function(data) {
                $scope.project.element.totalFiles -=1;
            });
            socket.on("document:archive", function(data) {
                $scope.project.element.totalDocuments -=1;
            });
            socket.on("thread:archive", function(data) {
                $scope.project.element.totalMessages -=1;
            });
        }
    };
});