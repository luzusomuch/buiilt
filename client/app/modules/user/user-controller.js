

angular.module('buiiltApp').controller('UserCtrl', function($scope, $state, authService) {
  $scope.errors = {};
  $scope.user = authService.getCurrentUser();
  $scope.password = {};
  $scope.email = {
    email : $scope.user.email
  };

  $scope.editEmail = function() {
    $scope.isEditEmail = true;
  };

  $scope.editPassword = function() {
    $scope.isEditPassword = true;
  };

  $scope.changeEmail = function(form) {
    $scope.emailFormSubmitted = true;
    if (form.$valid) {
      authService.changeEmail($scope.email).then(function() {

      })
    }

  };

  $scope.changePassword = function(form) {
    $scope.passwordFormSubmitted = true;
    if (form.$valid) {
      authService.changePassword($scope.password.oldPassword,$scope.password.newPassword).then(function() {
        $scope.isEditPassword = false;
        $scope.passwordFormSubmitted = false;
        $scope.password = {};
        Materialize.toast('<span>Your password has been change success fully </span>', 5000,'rounded');
      }, function(res) {
        var err = res.data;
        if (err.oldPassword) {
          Materialize.toast('<span>Your old password dose not correct</span>', 5000,'rounded');
        }
      });
    }
  };

  $scope.changeProfile = function() {
    authService.changeProfile($scope.user.firstName, $scope.user.lastName, $scope.user.phoneNumber)
    .then(function(data){
      $scope.user = data;
    });
  }
});

angular.module('buiiltApp').controller('TeamInvitationCtrl', function($scope, $state, authService,invitations) {
  $scope.invitations = invitations;
});