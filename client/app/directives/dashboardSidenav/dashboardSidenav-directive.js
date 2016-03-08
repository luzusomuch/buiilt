'use strict';
angular.module('buiiltApp').directive('dashboardSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/dashboardSidenav/dashboardSidenav.html',
        scope:{
            tasks:'=',
            messages: "=",
            files: "=",
            documents: "="
        },
        controller: function($scope, $rootScope, $location, $state, socket) {
			$scope.$state = $state;
            
            var today = new Date();
            $scope.totalTaskUpdates = 0;
            _.each($scope.tasks, function(task) {
                if (task.element.notifications.length > 0) {
                    $scope.totalTaskUpdates += 1;
                }
            });

            $scope.totalFileUpdates = $scope.files.length;
            $scope.totalDocumentUpdates = $scope.documents.length;
            $scope.totalMessagesUpdate = $scope.messages.length;

            var listenerCleanFn = $rootScope.$on("DashboardSidenav-UpdateNumber", function(event, data) {
                if (data.type==="task") {
                    $scope.totalTaskUpdates = (data.isAdd) ? data.number : $scope.totalTaskUpdates-1;
                } else if (data.type==="file") {
                    $scope.totalFileUpdates = (data.isAdd) ? data.number : $scope.totalFileUpdates-data.number;
                } else if (data.type==="document") {
                    $scope.totalDocumentUpdates = (data.isAdd) ? data.number : $scope.totalDocumentUpdates-data.number;
                } else if (data.type==="message") {
                    $scope.totalMessagesUpdate = (data.isAdd) ? data.number : $scope.totalMessagesUpdate-data.number;
                }
            });

            $scope.$on('$destroy', function() {
                listenerCleanFn();
            });

            // socket.on("dashboard:new", function(data) {
            //     if (data.type==="file") {
            //         if (data.file.element.type==="file") {
            //             $scope.totalFileUpdates = $scope.totalFileUpdates + 1;
            //         } else if (data.file.element.type==="document") {
            //             $scope.totalDocumentUpdates = $scope.totalDocumentUpdates + 1;
            //         }
            //     }
            // });

        }
    };
});