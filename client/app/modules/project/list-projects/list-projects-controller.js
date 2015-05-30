angular.module('buiiltApp').controller('ProjectListCtrl', function($scope, $timeout, $q, projectService) {
  $scope.errors = {};
  $scope.projects = {};
  projectService.index().$promise.then(function(data) {
    $scope.projects = data;
  }, function(res) {
    $scope.errors = res.data;
  })
});