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
            
            var today = new Date();
            $scope.totalTaskUpdates = 0;
            _.each($scope.tasks, function(task) {
                // if (task.dateEnd && moment(moment(task.dateEnd).format("YYYY-MM-DD")).isBetween(moment(today).format("YYYY-MM-DD"),moment(today).add(3, "days").format("YYYY-MM-DD"))) {
                    // $scope.totalTaskUpdates += 1;
                // }
                if (task.element.notifications.length > 0) {
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

            var listenerCleanFn = $rootScope.$on("DashboardSidenav-UpdateNumber", function(event, data) {
                if (data.type==="task") {
                    $scope.totalTaskUpdates = $scope.totalTaskUpdates-data.number;
                } else if (data.type==="file") {
                    $scope.totalFileUpdates = $scope.totalFileUpdates-data.number;
                } else if (data.type==="document") {
                    $scope.totalDocumentUpdates = $scope.totalDocumentUpdates-data.number;
                } else if (data.type==="message") {
                    $scope.messages.splice(0, data.number);
                }
            });

            $scope.$on('$destroy', function() {
                listenerCleanFn();
            });

            socket.on("dashboard:new", function(data) {
                if (data.type==="thread") {
                    $scope.messages.push({_id: data._id});
                    $scope.messages = _.uniq($scope.messages, "_id");
                } else if (data.type==="task") {
                    $scope.totalTaskUpdates = $scope.totalTaskUpdates + 1;
                } else if (data.type==="file") {
                    if (data.file.element.type==="file") {
                        $scope.totalFileUpdates = $scope.totalFileUpdates + 1;
                    } else if (data.file.element.type==="document") {
                        $scope.totalDocumentUpdates = $scope.totalDocumentUpdates + 1;
                    }
                }
            });

        }
    };
});