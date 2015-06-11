angular.module('buiiltApp').controller('SignupCtrl', function ($scope, authService,$stateParams) {
  $scope.user = {
    allowNewsletter: true,
    type: 'homeOwner'
  };

  $scope.errors = {};

  $scope.signup = function () {
    console.log($stateParams)
    if ($stateParams.teamInviteToken) {
      $scope.user.teamInviteToken = $stateParams.teamInviteToken;
    }
    authService.createUser($scope.user).then(function (data) {
      //show alert
      $scope.success = true;
      $scope.user = {
        allowNewsletter: true
      };
    }, function (res) {
      $scope.errors = res.data;
    });
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});