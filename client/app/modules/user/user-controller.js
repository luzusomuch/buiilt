angular.module('buiiltApp').controller('UserCtrl', function($scope, $state, userService,authService) {

  $scope.errors = {};
  $scope.currentUser = {};
  userService.get().$promise.then(function(data){
    //show alert
    $scope.currentUser = data;
    $scope.success = true;
  }, function(res){
      $scope.errors = res.data;
  });
  //};

  $scope.edit = function() {

  };

  $scope.delete = function() {
    userService.delete().$promise.then(function() {
      $scope.success = true;
    })
  }

  $scope.closeAlert = function(key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function(){
    $scope.success = false;
  };
});

angular.module('buiiltApp').controller('UserFormCtrl', function($scope, $state, authService) {
  $scope.errors = {};
  $scope.user = {};
  $scope.changeEmail = function() {

  };

  $scope.changePw = function() {
    authService.changePassword($scope.user.password, $scope.user.rePassword).then(function(data) {
      $scope.user = data;
    }, function(res) {
      $scope.errors = res.data;
    });
  };

  $scope.changePhoneNum = function() {
    authService.changePhoneNum($scope.user.phoneNumber).then(function(data) {
      $scope.user = data;
    }, function(res) {
      $scope.errors = res.data;
    });
  };

  $scope.changeProfile = function() {
    authService.changeProfile($scope.user.firstName, $scope.user.lastName).then(function(data){
      $scope.user = data;
    });
  }
});

angular.module('buiiltApp').controller('TeamInvitationCtrl', function($scope, $state, authService,invitations) {
  $scope.invitations = invitations;
});