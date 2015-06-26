angular.module('buiiltApp').controller('ClientCtrl', function($scope, $rootScope, $timeout, $q, buiderPackageRequest) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.buiderPackageRequest = buiderPackageRequest;
});