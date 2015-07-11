angular.module('buiiltApp')
  .controller('SignupWithInviteCtrl', function ($scope,authService,$q,$cookieStore,$state,userService,$stateParams, packageInviteService) {
  $scope.user = {
    lastName: '',
    firstName: '',
    allowNewsletter: true
  };
  $scope.currentUser = {};
  $scope.errors = {};

  packageInviteService.getByPackageInviteToken({id: $stateParams.packageInviteToken})
  .$promise.then(function(data){
    $scope.packageInvite = data;
  });

  $scope.signup = function (form) {
    if ($stateParams.packageInviteToken) {
      $scope.user.packageInviteToken = $stateParams.packageInviteToken;
    }
    $scope.submitted = true;
    if (form.$valid) {
      authService.createUserWithInvite($scope.user).then(function (data) {
      }, function (res) {
        $scope.errors = res.data;
      });
    }

  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});