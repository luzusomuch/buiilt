angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService) {
  $scope.contractor = {};
  $scope.currentProject = $rootScope.currentProject;
  $scope.emailsPhone = [];
  $scope.user = authService.getCurrentUser();
  if ($scope.user) {
    teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
      $scope.team = team;
    });
  }

  // projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
  //   $scope.projects = projects;
  // });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
  };

  $scope.createContractorPackage = function(){
    contractorService.createContractorPackage({contractor: $scope.contractor,emailsPhone: $scope.emailsPhone, project: $stateParams.id}).$promise.then(function(data) {

    });
  };
});

