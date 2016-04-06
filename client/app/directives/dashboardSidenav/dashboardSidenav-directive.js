'use strict';
angular.module('buiiltApp').directive('dashboardSidenav', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/dashboardSidenav/dashboardSidenav.html',
        scope:{
            tasks:'=',
            messages: "=",
            files: "="
        },
        controller: function($scope, $rootScope, $location, $state, socket) {
			$scope.$state = $state;
            
            /*Count total in dashboard side nav*/
            $scope.totalTaskUpdates = 0;
            _.each($scope.tasks, function(task) {
                if (task.element.notifications.length > 0) {
                    $scope.totalTaskUpdates += 1;
                }
            });

            $scope.totalFileUpdates = 0;
            $scope.totalDocumentUpdates = 0
            _.each($scope.files, function(file) {
                if (file.element.type==="file") {
                    $scope.totalFileUpdates += 1;
                } else if (file.element.type==="document") {
                    $scope.totalDocumentUpdates += 1;
                }
            })
            $scope.totalMessagesUpdate = $scope.messages.length;

            /*Update count total in dashboard side nav*/
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
        }
    };
});