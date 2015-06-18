angular.module('buiiltApp').controller('CreateProjectCtrl', function($scope, $state, projectService,filterFilter,homeOwnerTeam,teamService) {
  $scope.errors = {};
  $scope.project = {
    location: {}
  };
  teamService.getCurrentTeam().$promise.then(function(data) {
    $scope.currentTeam = data;
  });
  
  $scope.inputChanged = function(str) {
    $scope.textString = str;
  };

  // $scope.homeOwnerTeam = homeOwnerTeam;
  // $scope.homeOwnerTeam.member  = filterFilter($scope.homeOwnerTeam.member, {status : 'Active'});
  $scope.create = function() {
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