angular.module('buiiltApp').controller('SigninCtrl', function($scope, $state, authService) {

  $scope.errors = {};

  $scope.signin = function(){
    authService.login($scope.user).then(function(data){
      //show alert
      $scope.success = true;
      $state.go('home');
    }, function(res){
        $scope.errors = res.data;
    });
  };

  $scope.closeAlert = function(key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function(){
    $scope.success = false;
  };
});