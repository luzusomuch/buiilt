angular.module('buiiltApp').controller('CreateProjectCtrl', function($scope, $timeout, $q, $cookieStore, projectService, userService) {
  var currentUser = {};
  if ($cookieStore.get('token')) {
    currentUser = userService.get();
  }
  $scope.errors = {};
  $scope.project = {
    location: {},
    requestedHomeBuilders: []
  };
  $scope.create = function() {
    // console.log($scope.project.requestedHomeBuilders);
    // console.log($scope.project.requestedHomeBuilders.split(','));
    $scope.project.requestedHomeBuilders = $scope.project.requestedHomeBuilders.split(',');
    projectService.create($scope.project).$promise.then(function(data) {
      //show alert
      $scope.success = true;

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