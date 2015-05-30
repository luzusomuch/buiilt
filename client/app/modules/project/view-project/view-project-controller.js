angular.module('buiiltApp').controller('ViewProjectCtrl', function($scope, $timeout, $q, projectService, project) {
  $scope.errors = {};
  $scope.project=project;
  $scope.sendQuote = function() {
    $scope.project.$update(function(data){
      console.log(data);
    });
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});