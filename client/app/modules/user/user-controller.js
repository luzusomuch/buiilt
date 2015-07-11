

angular.module('buiiltApp').controller('UserCtrl', function($scope,$rootScope, $state, authService) {
  $scope.errors = {};
  $scope.user = authService.getCurrentUser();
  $scope.password = {};
  $scope.email = {
    email : $scope.user.email
  };
  $scope.profile = angular.copy($scope.user);

  $scope.editEmail = function() {
    $scope.isEditEmail = true;
  };

  $scope.editPassword = function() {
    $scope.isEditPassword = true;
  };

  $scope.editProfile = function() {
    $scope.isEditProfile = true;
  };

  $scope.cancelProfile = function() {
    $scope.isEditProfile = false;
    $scope.profileFormSubmitted = false;
    $scope.profile = angular.copy($scope.user);
  };

  $scope.cancelPassword = function() {
    $scope.isEditPassword = false;
    $scope.passwordFormSubmitted = false;
    $scope.password = {};
  };

  $scope.cancelEmail = function() {
    $scope.isEditEmail = false;
    $scope.emailFormSubmitted = false;
    $scope.email = {
      email : $scope.user.email
    };
  };

  $scope.changeEmail = function(form) {
    $scope.emailFormSubmitted = true;
    if (form.$valid) {
      var newEmail = $scope.email.email;
      if (newEmail != $scope.user.email) {
        authService.changeEmail($scope.email).then(function() {
          $scope.success = true;
          $scope.successMsg = "An email has been sent to your email to confirm your change";
          $scope.cancelEmail();
        })
      } else {
        $scope.cancelEmail();
      }
    }

  };

  $scope.changePassword = function(form) {
    $scope.passwordFormSubmitted = true;
    if (form.$valid) {
      authService.changePassword($scope.password.oldPassword,$scope.password.newPassword).then(function() {
        $scope.cancelPassword();
        $scope.success = true;
        $scope.error = false;
        $scope.successMsg = "Your password has been change success fully ";
      }, function(res) {
        var err = res.data;
        if (err.oldPassword) {
          $scope.error = true;
          $scope.success = false;
          $scope.errorMsg = "Your old password dose not correct";
        }
      });
    }
  };

  $scope.changeProfile = function(form) {
    $scope.profileFormSubmitted = true;
    if (form.$valid) {
      authService.changeProfile($scope.profile.firstName, $scope.profile.lastName, $scope.profile.phoneNumber)
        .then(function(data){
          $scope.isEditProfile = false;
          $scope.profileFormSubmitted = false;
          $rootScope.$emit('Profile.change',data)

        });
    }
  }
});

angular.module('buiiltApp').controller('TeamInvitationCtrl', function($scope, $state, authService,invitations) {
  $scope.invitations = invitations;
});