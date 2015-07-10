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
  
  $scope.createDocument = function() {
    documentService.create({'id': $scope.project._id},$scope.docum).$promise
      .then(function(data) {
      $scope.success = true;
    });
  };

  // $scope.downloadAll = function() {
  //   fileService.downloadAll({id: $stateParams.id}).$promise.then(function(data){
  //     _.each(data, function(url){
  //       $window.open(url.url);
  //     });
  //   });
  // };

  $scope.closeAlert = function (key) {
    delete $scope.errors[key];
  };

  $scope.closeSuccess = function () {
    $scope.success = false;
  };
});