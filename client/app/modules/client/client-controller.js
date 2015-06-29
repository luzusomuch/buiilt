angular.module('buiiltApp').controller('ClientCtrl', function($scope, $rootScope, $timeout, $q, builderPackage) {
    $scope.currentProject = $rootScope.currentProject;
    $scope.builderPackage = builderPackage;
});