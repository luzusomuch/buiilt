angular.module('buiiltApp')
  .controller('SignupCtrl', function ($scope, authService,$stateParams,inviteTokenService) {
  $scope.user = {
    password : '',
    lastName: '',
    firstName: '',
    repassword : '',
    allowNewsletter: true,
    type: 'homeOwner',
  };
  $scope.acceptTeam = false;
  $scope.hasInviteToken = ($stateParams.inviteToken) ? true : false;
  if ($scope.hasInviteToken) {
    inviteTokenService.get({id : $stateParams.inviteToken}).$promise
      .then(function(res) {
        $scope.user.invite = res;
        $scope.user.invite
        $scope.user.email = res.email;
      })
  }
  $scope.submitted = false;
  $scope.errors = {};

  $scope.signup = function (form) {
    $scope.submitted = true;
    if (form.$valid) {
      authService.createUser($scope.user).then(function (data) {
        //show alert
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