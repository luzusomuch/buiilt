angular.module('buiiltApp')
  .directive("compareTo", function() {
    return {
      require: "ngModel",
      scope: {
        confirmPassword: "=compareTo"
      },
      link: function(scope, element, attributes, modelVal) {

        modelVal.$validators.compareTo = function(val) {
          return val == scope.confirmPassword;
        };

        scope.$watch("confirmPassword", function() {
          modelVal.$validate();
        });
      }
    };
  })
  .controller('SignupCtrl', function ($scope, authService,$stateParams,teamInviteService) {
  $scope.user = {
    password : '',
    repassword : '',
    allowNewsletter: true,
    type: 'homeOwner',
    acceptTeam : false
  };
  $scope.acceptTeam = false
  $scope.hasInviteToken = ($stateParams.teamInviteToken) ? true : false;
  if ($scope.hasInviteToken) {
    teamInviteService.get({id : $stateParams.teamInviteToken}).$promise
      .then(function(res) {
        $scope.inviteData = res;
        $scope.user.email = res.email;
      })
  }
  $scope.submitted = false;
  $scope.errors = {};

  $scope.signup = function (form) {
    $scope.submitted = true;
    if (form.$valid) {
      if ($scope.inviteData) {
        $scope.user.invite = $scope.inviteData;
      }


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