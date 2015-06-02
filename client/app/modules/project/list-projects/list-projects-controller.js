angular.module('buiiltApp').controller('ProjectListCtrl', function($scope, $timeout, $q, projectService, packageService) {
  $scope.errors = {};
  $scope.projects = {};
  projectService.index().$promise.then(function(data) {
    $scope.projects = data;
    angular.forEach(data, function(project) {
      packageService.getPackageByProject({'id': project._id}).$promise.then(function(data) {
        $scope.builderPackage = data;
      })  
    });
  }, function(res) {
    $scope.errors = res.data;
  })
});