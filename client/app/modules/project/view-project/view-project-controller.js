angular.module('buiiltApp').controller('ViewProjectCtrl', function($scope, $stateParams, currentTeam,documentService, projectService, project, packageService) {
  $scope.errors = {};
  $scope.project=project;
  $scope.docum = {};
  $scope.currentTeam = currentTeam;
  // $scope.currentUser = currentUser;
  packageService.getPackageByProject({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.builderPackage = data;
  });
  // $scope.isLeader = (_.find(currentTeam.leader,{_id : $scope.currentUser._id})) ? true : false;
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