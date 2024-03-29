angular.module('buiiltApp')
  .controller('SigninCtrl', function ($rootScope, $scope, authService, $window,$stateParams,$state, socket) {
    $scope.user = {};
    $scope.errors = {};
    $scope.submitted = false;
    $rootScope.title = "Sign In";
    if ($stateParams.action) {
      if (!$stateParams.error) {
        $scope.success = true;
        // $scope.successMsg = "Your email has been changed successfully"
      }
    }


    $scope.signin = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        authService.login($scope.user).then(function (res) {
          socket.emit('join', res.id);
          window.location.href = "/dashboard/tasks";
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