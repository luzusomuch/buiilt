angular.module('buiiltApp')
    .controller('SigninBackendCtrl', function ($rootScope,$scope, authService, $state, $cookieStore) {
        $scope.user = {};
        $scope.errors = {};

        $scope.signin = function (form) {
            $scope.submitted = true;
            if (form.$valid) {
                authService.login($scope.user).then(function (data) {
                    // $window.location.href = '/team/manager';
                    if (data.role === 'admin') {
                        $state.go('dashboardBackend');
                    }
                    else {
                        $cookieStore.remove('token');
                        $state.go('signinBackend');
                    }
            }, function (res) {
                $scope.error = true;
                $scope.errorMsg = res.message;
            });
        }
    };

    $scope.closeAlert = function (key) {
        delete $scope.errors[key];
    };
});