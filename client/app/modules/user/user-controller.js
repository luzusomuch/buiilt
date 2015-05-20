angular.module('buiiltApp').controller('UserCtrl', function($scope, $state, userService) {

  $scope.errors = {};
  $scope.users = {};
  userService.gets().$promise.then(function(data){
    //show alert
    $scope.users = data;
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