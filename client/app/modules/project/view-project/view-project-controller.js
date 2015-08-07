angular.module('buiiltApp').controller('ViewProjectCtrl', function($window,$scope, $stateParams, authService,documentService, projectService, project, packageService, fileService) {
  $scope.errors = {};
  $scope.project=project;
  $scope.docum = {};
  authService.getCurrentTeam().$promise.then(function(team){
    $scope.currentTeam = team;
    authService.getCurrentUser().$promise.then(function(user){
      $scope.isLeader = (_.find(team.leader,{_id : user._id})) ? true : false;
    });
  });
  packageService.getPackageByProject({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.builderPackage = data;
  });
  fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
    $scope.files = data;
  });

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };

  $scope.hasFilter = false;
  $scope.filter = function(value){
    if (value == 'all') {
      $scope.hasFilter = false;
    }
    else {
      $scope.hasFilter = true;
      $scope.filterValue = value;
    }
  };
});