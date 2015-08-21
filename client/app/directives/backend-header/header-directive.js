angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/backend-header/header.html',
        controller: function($stateParams,$state,$rootScope,authService, userService, $scope,$cookieStore) {
            $scope.currentUser = {};
            if ($cookieStore.get('token')) {
                $scope.currentUser = userService.get();
            }
            $scope.currentProjectBackend = $rootScope.currentProjectBackend;
            $scope.currentPackageId = $rootScope.currentPackageId;
            $scope.currentPackageType = $rootScope.currentPackageType;
            console.log($scope.currentPackageId);
        }
    }
});