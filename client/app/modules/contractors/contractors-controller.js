angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, $timeout, $q, contractorService, userService, projectService) {
  $scope.contractor = {};
  $scope.user = userService.get();
  $scope.contractor.user = $scope.user._id;

  projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
    $scope.projects = projects;
  });

  $scope.createContractorPackage = function(){
    console.log($scope.contractor);
    contractorService.createContractorPackage($scope.contractor).$promise.then(function(data) {

    });
  };
});

