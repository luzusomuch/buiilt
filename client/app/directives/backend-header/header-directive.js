angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/backend-header/header.html',
        controller: function($state,$rootScope,authService, userService, $scope,$cookieStore) {
            $scope.currentUser = {};
            if ($cookieStore.get('token')) {
                $scope.currentUser = userService.get();
            }
        }
    }
});