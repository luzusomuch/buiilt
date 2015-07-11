angular.module('buiiltApp')
  .controller('SigninCtrl', function ($scope, authService, $window,$stateParams) {
    $scope.user = {};
    $scope.errors = {};
    $scope.submitted = false;
    if ($stateParams.action) {
      if (!$stateParams.error) {
        $scope.success = true;
        $scope.successMsg = "Your email has been changed successfully"
      }
    }


    $scope.signin = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        authService.login($scope.user).then(function () {
          //show alert
          $window.location.href = '/team/manager';
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