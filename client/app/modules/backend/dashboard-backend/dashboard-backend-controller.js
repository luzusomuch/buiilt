angular.module('buiiltApp')
.controller('DashboardBackendCtrl', function($scope, $state, allUsers, allProjects) {
    $scope.allProjects = allProjects;
    $scope.allUsers = allUsers;
});
