angular.module('buiiltApp').controller('ViewProjectCtrl', function($scope, $stateParams, $timeout, $q, documentService, projectService, project, packageService) {
  $scope.errors = {};
  $scope.project=project;
  $scope.docum = {};
  packageService.getPackageByProject({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.builderPackage = data;
  });
  // $scope.sendQuote = function() {
  //   $scope.project.$update(function(data){
  //     console.log(data);
  //   });
  // };

  $scope.createDocument = function() {
    documentService.create({'id': $scope.project._id},$scope.docum).$promise
      .then(function(data) {
      $scope.success = true;
    });
  };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});