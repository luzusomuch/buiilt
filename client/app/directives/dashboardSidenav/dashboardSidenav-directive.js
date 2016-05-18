'use strict';
angular.module('buiiltApp').directive('dashboardSidenav', function(){
    return {
        restrict: 'E',
        templateUrl: 'app/directives/dashboardSidenav/dashboardSidenav.html',
        scope:{
            tasks:'=',
            messages: "=",
            files: "=",
            documents: "="
        },
        controller: function($scope, $rootScope, $state) {
			$scope.$state = $state;
            
            /*Count total in dashboard side nav*/
            $scope.totalTaskUpdates = 0;
            _.each($scope.tasks, function(task) {
                if (task.__v > 0) {
                    $scope.totalTaskUpdates +=1;
                }
            });

            $scope.totalFileUpdates = $scope.files.length;
            $scope.totalDocumentUpdates = $scope.documents.length;
            $scope.totalMessagesUpdate = $scope.messages.length;

            /*Update count total in dashboard side nav*/
            var listenerCleanFn = $rootScope.$on("DashboardSidenav-UpdateNumber", function(event, data) {
                if (data.type==="task") {
                    $scope.totalTaskUpdates = (data.isAdd) ? $scope.totalTaskUpdates+1 : $scope.totalTaskUpdates-1;
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