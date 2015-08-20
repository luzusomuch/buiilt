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
            console.log($scope.currentUser);
            function queryIsAdminLoggedin(callback){
                var cb = callback || angular.noop;
                console.log(authService.isAdmin());
                authService.isLoggedInAsync(function(isLoggedIn){
                    console.log(isLoggedIn);
                    if (isLoggedIn) {
                        authService.getCurrentUser().$promise.then(function(res){
                            $scope.currentUser = res;
                            console.log($scope.currentUser);
                        });
                    }
                    else {
                        console.log('asdasdsadsad');
                        return cb();
                    }
                });            
            }

            queryIsAdminLoggedin();
            console.log($rootScope.isAdminLogin);
        }
    }
});