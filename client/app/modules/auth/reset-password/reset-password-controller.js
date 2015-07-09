angular.module('buiiltApp')
  .controller('ResetPasswordCtrl', function ($scope, authService, $stateParams,token) {
    $scope.email = '';
    $scope.errors = {};
    $scope.submitted = false;
    $scope.token = token;

    $scope.hasToken = (token._id) ? true : false;
    $scope.isExpired = new Date($scope.token.expired) < new Date();
    $scope.reset = {
      password : ""
    };
    $scope.resetPassword = function(form) {
      $scope.submitted = true;
      if (form.$valid) {
        authService.resetPassword({token: $stateParams.token,password : $scope.reset.password}).$promise
          .then(function(res) {
            $scope.success = true;
            $scope.successMsg = 'Your password has been change click <a href="/signin">here</a> to go to login page';
            $scope.password = '';
            $scope.repassword = '';

            $scope.submitted = false;
          })
      }
    }
  });