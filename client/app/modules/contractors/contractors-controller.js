angular.module('buiiltApp').controller('ContractorsCtrl',
  function($scope, team, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService,contractorPackages) {
    $scope.contractor = {};
    $scope.contractorPackages = contractorPackages;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam = team;
    $scope.user = authService.getCurrentUser();
    $scope.filter = {isAccept : true}

    // $scope.team = authService.getCurrentTeam();

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




    // projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
    //   $scope.projects = projects;
    // });

    $scope.member = {
      email :{},
      emailsPhone: []
    };
    $scope.addUser = function() {
      if ($scope.member.email.title) {
        if (!(_.find($scope.member.emailsPhone,{email : $scope.member.email.title}))) {
          $scope.member.emailsPhone.push({email: $scope.member.email.title, phoneNumber: $scope.newPhoneNumber});
        }
      }
      else {
        if (!(_.find($scope.member.emailsPhone,{email : $scope.textString}))) {
          $scope.member.emailsPhone.push({email: $scope.textString, phoneNumber: $scope.newPhoneNumber});
        }
      }
      // $scope.emailsPhone.newEmail = null;
      $scope.newPhoneNumber = null;
      $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.inputChanged = function(str) {
      $scope.textString = str;
    };

    $scope.removeUser = function(index) {
      $scope.emailsPhone.splice(index, 1);
    };

    $scope.createContractorPackage = function(){
      contractorService.createContractorPackage({contractor: $scope.contractor, team: $scope.currentTeam._id,emailsPhone: $scope.member.emailsPhone, project: $stateParams.id}).$promise.then(function(data) {
        $scope.contractors.push(data);
      });
    };


});

