angular.module('buiiltApp')
  .controller('ForgotPasswordCtrl', function ($scope, authService, $window,$timeout) {
    $scope.email = '';
    $scope.errors = {};
    $scope.submitted = false;
    $scope.forgotPassword = function (form) {
      $scope.submitted = true;
      if (form.$valid) {

      }
      authService.forgotPassword({email : $scope.email}).$promise
        .then(function () {
        $scope.success = true;
        $scope.successMsg = 'An email will be sent to your Primary Email address that includes a password reset link';
        $scope.email = '';

        $scope.submitted = false;
        $timeout(function() {
          //$scope.success = false;
        },3000)
      }, function (res) {
          angular.forEach(res.data.errors, function (error, field) {
            console.log(field);
            if ($scope.form[field]) {
              $scope.form[field].$setValidity('mongoose', false);
              $scope.errors[field] = error.message;
            }
          });
      });
    };
  });