angular.module('buiiltApp').controller('CreateProjectCtrl', function($scope, $state, projectService) {
  $scope.errors = {};
  $scope.project = {
    location: {}
  };
  $scope.create = function() {
    projectService.create($scope.project).$promise.then(function(data) {
      //show alert
      $scope.success = true;

      //go to send quote form
      $state.go('builderPackages.sendQuote', {id: data._id});
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