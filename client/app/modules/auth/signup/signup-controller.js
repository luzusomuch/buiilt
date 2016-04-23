angular.module('buiiltApp')
  .controller('SignupCtrl', function ($rootScope, $scope, authService, $stateParams, inviteTokenService, packageInviteService) {
  $scope.user = {
    password : '',
    lastName: '',
    firstName: '',
    repassword : '',
    allowNewsletter: true,
  };
  $scope.acceptTeam = false;
  $scope.hasInviteToken = ($stateParams.inviteToken) ? true : false;
  $scope.hasPackageInviteToken = ($stateParams.packageInviteToken) ? true : false;
  if ($scope.hasInviteToken) {
    inviteTokenService.get({id : $stateParams.inviteToken}).$promise
    .then(function(res) {
      $scope.user.invite = res;
      $scope.user.invite;
      $scope.user.email = res.email;
    });
  } else if ($scope.hasPackageInviteToken) {
    packageInviteService.getByPackageInviteToken({id: $stateParams.packageInviteToken})
    .$promise.then(function(data){
      $scope.packageInvite = data;
      $scope.user.email = data.to;
    });
  }
  $scope.submitted = false;
  $scope.errors = {};

  $scope.signup = function (form) {
    $scope.submitted = true;
    if (form.$valid) {
      if ($scope.hasPackageInviteToken) {
        $scope.user.packageInviteToken = $stateParams.packageInviteToken;
      }
      authService.createUser($scope.user).then(function (data) {
        $scope.success = true;
        $scope.user = {
          allowNewsletter: true
        };
        $scope.submitted = false;
      }, function (res) {
        $scope.submitted = false;
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