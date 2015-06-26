angular.module('buiiltApp').controller('ClientCtrl', function($scope, $rootScope, $timeout, $q, builderPackageRequest) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackageRequest = builderPackageRequest;
});