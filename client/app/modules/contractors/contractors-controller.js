angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService) {
  $scope.contractor = {};
  $scope.currentProject = $rootScope.currentProject;
  $scope.emailsPhone = [];
  $scope.user = authService.getCurrentUser();
  $scope.team = authService.getCurrentTeam();

  contractorService.getContractorByProjectForBuilder({'id': $stateParams.id}).$promise.then(function(data){
    $scope.contractors = data;
  });

  // projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
  //   $scope.projects = projects;
  // });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
    $scope.newEmail = null;
    $scope.newPhoneNumber = null;
  };

  $scope.removeUser = function(index) {
    $scope.emailsPhone.splice(index, 1);
  };

  $scope.createContractorPackage = function(){
    contractorService.createContractorPackage({contractor: $scope.contractor,emailsPhone: $scope.emailsPhone, project: $stateParams.id}).$promise.then(function(data) {
      $scope.contractors.push(data);
    });
  };

  $scope.getContractorPackageTenderByProjectForBuilder = function() {
    contractorService.getContractorPackageTenderByProjectForBuilder({'id': $stateParams.id})
    .$promise.then(function(data) {
      $scope.contractorsInTender = data;
    }); 
  };

  $scope.getContractorPackageInProcessByProjectForBuilder = function() {
    contractorService.getContractorPackageInProcessByProjectForBuilder({'id': $stateParams.id})
    .$promise.then(function(data) {
      $scope.contractorsInProcess = data;
    }); 
  };

  //get contractor package for contractor
  $scope.getContractorPackageTenderByProjectForContractor = function() {
    contractorService.getContractorPackageTenderByProjectForContractor({'id': $stateParams.id})
    .$promise.then(function(data) {
      $scope.contractorsInTender = data;
    }); 
  };

  $scope.getContractorPackageInProcessByProjectForContractor = function() {
    contractorService.getContractorPackageInProcessByProjectForContractor({'id': $stateParams.id})
    .$promise.then(function(data) {
      $scope.contractorsInProcess = data;
    }); 
  };
});

