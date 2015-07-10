

angular.module('buiiltApp').controller('UserCtrl', function($scope, $state, authService) {
  $scope.errors = {};
  $scope.user = authService.getCurrentUser();

  $scope.editEmail = function() {
    $scope.isEditEmail = true;
  };

  $scope.saveEmail = function() {

  };

  $scope.changePw = function() {
    authService.changePassword($scope.user.password, $scope.user.rePassword).then(function(data) {
      $scope.user = data;
    }, function(res) {
      $scope.errors = res.data;
    });
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