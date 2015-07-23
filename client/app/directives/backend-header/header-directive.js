angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/backend-header/header.html',
        controller: function($rootScope, authService, $scope, authService) {
            authService.getCurrentUser().$promise.then(function(data){
                $scope.currentUser = data;
            });
        }
    }
});