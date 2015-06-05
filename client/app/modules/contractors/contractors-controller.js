angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, $rootScope, $timeout, $q, contractorService, userService, projectService) {
  $scope.contractor = {};
  $scope.currentProject = $rootScope.currentProject;
  $scope.emailsPhone = [];
  $scope.user = userService.get();

  projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
    $scope.projects = projects;
  });

  $scope.addUser = function() {
    $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
  };

  $scope.createContractorPackage = function(){
    contractorService.createContractorPackage({contractor: $scope.contractor,emailsPhone: $scope.emailsPhone}).$promise.then(function(data) {

    });
  };
});

