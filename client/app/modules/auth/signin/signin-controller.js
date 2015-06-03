angular.module('buiiltApp')
.controller('SigninCtrl', function ($scope, authService, $window) {
  $scope.user = {};
  $scope.errors = {};
  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $window.location.href = '/team/manager';
    }, function (res) {
      $scope.errors = res;
    });
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };
});