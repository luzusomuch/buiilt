angular.module('buiiltApp').controller('ProjectCtrl', function($scope, $timeout, $q) {
  
});

angular.module('buiiltApp').controller('FormProjectCtrl', function($scope, $timeout, $q,$cookieStore,projectService, userService) {

    var currentUser = {};
      if ($cookieStore.get('token')) {
        currentUser = userService.get();
      }
    $scope.errors = {};
    $scope.project = {
        location : {}
    };
    $scope.project = {
        user: currentUser._id
      };
    $scope.create = function(){
        projectService.create($scope.project).$promise.then(function(data){
          //show alert
          $scope.success = true;
          
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