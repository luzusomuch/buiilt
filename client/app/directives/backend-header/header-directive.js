angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/backend-header/header.html',
        controller: function($rootScope, userService, $scope,$cookieStore) {
            $scope.currentUser = {};
            if ($cookieStore.get('token')) {
                $scope.currentUser = userService.get();
            }
            console.log($scope.currentUser);
            // authService.getCurrentUser().$promise.then(function(data){
                // $scope.currentUser = data;
            // });
        }
    }
});