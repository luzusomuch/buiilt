angular.module('buiiltApp')
.directive('builtHeaderBackend', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/backend-header/header.html',
        controller: function($stateParams,$state,$rootScope,authService, userService, $scope,$cookieStore) {
            
        }
    };
});