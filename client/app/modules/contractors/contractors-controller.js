angular.module('buiiltApp').controller('ContractorsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, team, contractorService, authService, projectService, teamService) {
  $scope.contractor = {};
  $scope.currentProject = $rootScope.currentProject;
  $scope.emailsPhone = [];
  $scope.user = authService.getCurrentUser();
  $scope.team = authService.getCurrentTeam();
  teamService.getCurrentTeam().$promise.then(function(data) {
    $scope.team = data;
    if ($scope.team) {
      if ($scope.team.type == 'buider') {
        $scope.getContractorPackageTenderByProject = function() {
          contractorService.getContractorPackageTenderByProjectForBuilder({'id': $stateParams.id})
          .$promise.then(function(data) {
            $scope.contractorsInTender = data;
          }); 
        };

        $scope.getContractorPackageInProcessByProject = function() {
          contractorService.getContractorPackageInProcessByProjectForBuilder({'id': $stateParams.id})
          .$promise.then(function(data) {
            $scope.contractorsInProcess = data;
          }); 
        };
      }
      else if($scope.team.type === 'contractor') {
        $scope.getContractorPackageTenderByProject = function() {
          contractorService.getContractorPackageTenderByProjectForContractor({'id': $stateParams.id})
          .$promise.then(function(data) {
            $scope.contractorsInTender = data;
          }); 
        };

        $scope.getContractorPackageInProcessByProject = function() {
          contractorService.getContractorPackageInProcessByProjectForContractor({'id': $stateParams.id})
          .$promise.then(function(data) {
            $scope.contractorsInProcess = data;
          }); 
        };
      }
    }
  });

  teamService.getContractorTeam().$promise.then(function(data) {
    $scope.contractorTeams = data;
    var contractorTeamMember = [];
    angular.forEach($scope.contractorTeams, function(contractorTeam) {
      _.each(contractorTeam.leader, function(leader) {
        contractorTeamMember.push({_id: leader._id, email: leader.email});
      });
      _.each(contractorTeam.member, function(member){
        if (member._id) {
          contractorTeamMember.push({_id: member._id._id, email: member._id.email});
        }
      })
    });
    $scope.contractorTeamMember = contractorTeamMember;
  });
  

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

  
});

