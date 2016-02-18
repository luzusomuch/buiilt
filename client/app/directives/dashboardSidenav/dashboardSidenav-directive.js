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
        controller: function($scope, $rootScope, $location, $state) {
			$scope.$state = $state;
            
            var today = new Date();
            $scope.totalTaskUpdates = 0;
            _.each($scope.tasks, function(task) {
                if (task.dateEnd && moment(moment(task.dateEnd).format("YYYY-MM-DD")).isBetween(moment(today).format("YYYY-MM-DD"),moment(today).add(3, "days").format("YYYY-MM-DD"))) {
                    $scope.totalTaskUpdates += 1;
                }
            });

            $scope.totalFileUpdates = 0;
            $scope.totalDocumentUpdates = 0;
            _.each($scope.files, function(file) {
                if (file.element.type==="file") {
                    $scope.totalFileUpdates+=1;
                } else if (file.element.type==="document") {
                    $scope.totalDocumentUpdates+=1;
                }
            });

        }
    };
});