angular.module('buiiltApp').controller('UserCtrl', function($scope, $state, authService) {

  $scope.errors = {};

  $scope.closeAlert = function(key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function(){
    $scope.success = false;
  };
});