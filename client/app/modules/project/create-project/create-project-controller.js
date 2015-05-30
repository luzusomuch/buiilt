angular.module('buiiltApp').controller('CreateProjectCtrl', function($scope, projectService) {
  $scope.errors = {};
  $scope.project = {
    location: {}
  };
  $scope.create = function() {
    projectService.create($scope.project).$promise.then(function(data) {
      //show alert
      $scope.success = true;

      console.log(data);

    }, function(res) {
      $scope.errors = res.data;
    });
  };

  $scope.closeAlert = function(key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };
});