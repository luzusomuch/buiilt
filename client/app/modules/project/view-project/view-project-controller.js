angular.module('buiiltApp').controller('ViewProjectCtrl', function($scope, $stateParams, $timeout, $q, projectService, project, packageService) {
  $scope.errors = {};
  $scope.project=project;
  packageService.getPackageByProject({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.builderPackage = data;
  });
  // $scope.sendQuote = function() {
  //   $scope.project.$update(function(data){
  //     console.log(data);
  //   });
  // };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});