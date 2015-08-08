angular.module('buiiltApp').controller('ContractorsCtrl',
  function(taskService,fileService,teamService,$scope, $state,socket, team, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService,contractorPackages) {
    $scope.contractor = {
      descriptions : []
    };
    $scope.contractorPackages = contractorPackages;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam = team;
    $scope.user = authService.getCurrentUser();
    $scope.filter = {};
    $scope.submitted = false;
    if ($scope.currentTeam.type == 'supplier' || $scope.currentTeam.type == 'homeOwner') {
      $state.go('team.manager');
    }
    // $scope.isBuilder = ($scope.contractorPackages.owner == $scope.currentTeam._id) ? true : false;
    // $scope.canSee = (_.find(contractorPackages.to, {_id: $scope.currentTeam._id})) ? true : false;
    // $scope.team = authService.getCurrentTeam();

    _.forEach($scope.contractorPackages,function(contractorPackage) {
        contractorPackage.isContractor = (_.find(contractorPackage.to, {_id: $scope.currentTeam._id})) ? true: false;
        fileService.getFileByPackage({id: contractorPackage._id, type: 'contractor'}).$promise.then(function(files){
          contractorPackage.files = files;
        });
        taskService.getByPackage({id: contractorPackage._id, type: 'contractor'}).$promise.then(function(tasks){
          contractorPackage.tasks = tasks;
        })
    });

    // Real time process
    $rootScope.$on('notification:allRead',function(event) {
      _.forEach($scope.contractorPackages,function(item) {
        item.__v =  0;
      })
    });

    $scope.$watch('contractorPackages',function(value) {
      $scope.inProgressTotal = 0;
      _.forEach(value,function(item) {
        $scope.inProgressTotal += item.__v
      });
    },true);

    socket.on('notification:new', function (notification) {
      if (notification) {
        var contractorPackage = _.find($scope.contractorPackages,{_id : notification.element._id});
        if (contractorPackage) {
          contractorPackage.__v++;
        }
      }
    });

    // End Real time process

    $scope.contractor = {
      descriptions : []
    };
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

    $scope.contractorMember = {
      email :{},
      emailsPhone: []
    };
    $scope.contractorSubmitted = false;
    $scope.contractorAddUser = function() {
      if ($scope.contractorMember.email.title) {
        if (!(_.find($scope.contractorMember.emailsPhone,{email : $scope.contractorMember.email.title}))) {
          $scope.contractorMember.emailsPhone.push({email: $scope.contractorMember.email.title, phoneNumber: $scope.newPhoneNumber})
          _.remove($scope.contractorTeamMember, {email : $scope.contractorMember.email.title});
          $scope.contractorMember.email = {};
        }
      }
      else {
        if ($scope.contractorTextString) {
          if (!(_.find($scope.contractorMember.emailsPhone,{email : $scope.contractorTextString}))) {
            $scope.contractorMember.emailsPhone.push({email: $scope.contractorTextString, phoneNumber: $scope.newPhoneNumber});
            $scope.contractorMember.email = {};
          }
        }
      }
      // $scope.emailsPhone.newEmail = null;
      $scope.newPhoneNumber = null;
      $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.contractorInputChanged = function(str) {
      $scope.contractorTextString = str;
    };

    $scope.contractorRemoveUser = function(index) {
      $scope.contractorMember.emailsPhone.splice(index, 1);
    };

    $scope.addDescriptionContractor = function(description) {
      if (description) {
        $scope.contractor.descriptions.push(description);
        $scope.description = '';
      }
    };

    $scope.removeDescriptionContractor = function(index) {
      $scope.contractor.descriptions.splice(index,1);
      $scope.description = '';
    };

    $scope.$watchGroup(['contractor.descriptions.length','contractorSubmitted'],function(value) {
      $scope.contractorDescriptionError = (value[0] <= 0 && value[1]);
    });

    $scope.$watchGroup(['contractorMember.emailsPhone.length','contractorSubmitted'],function(value) {
      $scope.trademenError = (value[0] <= 0 && value[1])
    });

    $scope.contractorDescriptionError = false;
    $scope.trademenError = false;
    $scope.createContractorPackage = function(form){
      $scope.contractorSubmitted = true;

      if (form.$valid && !$scope.trademenError && !$scope.contractorDescriptionError ) {
        contractorService.createContractorPackage({
          contractor: $scope.contractor,
          team: $scope.currentTeam._id,
          emailsPhone: $scope.contractorMember.emailsPhone,
          project: $stateParams.id
        }).$promise.then(function (data) {
            $state.go('contractorRequest.viewContractorRequest',{id : data.project, packageId : data._id});
            $('#newContractorPackage').closeModal();
          });
      }
    };

});

