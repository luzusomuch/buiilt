angular.module('buiiltApp').controller('MaterialsCtrl',
  function (messageService,$state,taskService,fileService,$scope,socket, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService, materialPackages, team) {
    
    $scope.contentHeight = $rootScope.maximunHeight - $rootScope.headerHeight - $rootScope.footerHeight - 130;
    
    $scope.material = {
      descriptions: [],
      isSkipInTender: false
    };
    $scope.materialPackages = materialPackages;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam = team;
    $scope.filter = {};
    $scope.filterAll = true;
    $scope.user = authService.getCurrentUser();
    $scope.requirements = [];
    $scope.submitted = false;
    $scope.inProgressTotal = 0;

    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'homeOwner') {
      $state.go('team.manager');
    }

    _.forEach($scope.materialPackages,function(materialPackage) {
        materialPackage.isSupplier = (_.find(materialPackage.to, {_id: $scope.currentTeam._id})) ? true: false;
        fileService.getFileByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(files){
          materialPackage.files = files;
        });
        taskService.getByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(tasks){
          materialPackage.tasks = tasks;
        });
        messageService.getByPackage({id: materialPackage._id, type: 'material'}).$promise.then(function(threads){
          materialPackage.threads = threads;
        })
    });

    // Real time process
    $rootScope.$on('notification:allRead',function(event) {
      _.forEach($scope.materialPackages,function(item) {
        item.__v =  0;
      })
    });

    $scope.$watch('materialPackages',function(value) {
      $scope.inProgressTotal = 0;
      _.forEach(value,function(item) {
        $scope.inProgressTotal += item.__v
      });
    },true);

    socket.on('notification:new', function (notification) {
      if (notification) {
        var materialPackage = _.find($scope.materialPackages,{_id : notification.element._id});
        if (materialPackage) {
          materialPackage.__v++;
        }
      }
    });

    // End Real time process

    //MATERIAL PACKAGE
    $scope.material = {
      descriptions: []
    };
    $scope.requirements = [];
    $scope.materialSubmitted = false;

    teamService.getSupplierTeam().$promise.then(function (data) {
      $scope.supplierTeams = data;
      var supplierTeamMember = [];
      angular.forEach($scope.supplierTeams, function (supplierTeam) {
        _.each(supplierTeam.leader, function (leader) {
          supplierTeamMember.push({_id: leader._id, email: leader.email});
        });
        _.each(supplierTeam.member, function (member) {
          if (member._id) {
            supplierTeamMember.push({_id: member._id._id, email: member._id.email});
          }
        })
      });
      $scope.supplierTeamMember = supplierTeamMember;
    });

    $scope.addNewRequire = function () {
      if ($scope.description && $scope.quantity) {
        $scope.requirements.push({description: $scope.description, quantity: $scope.quantity});
        $scope.description = null;
        $scope.quantity = null;  
      }
    };

    $scope.removeRequire = function (index) {
      $scope.requirements.splice(index,1);
    };

    $scope.addDescriptionMaterial = function(description) {
      if (description) {
        $scope.material.descriptions.push(description);
        $scope.description1 = '';
      }
    };

    $scope.removeDescriptionMaterial = function(index) {
      $scope.material.descriptions.splice(index,1);
    };

    $scope.materialMember = {
      email: {},
      emailsPhone: []
    };
    
    $scope.addNewSupplier = function () {
      if ($scope.materialMember.email.title) {
        if (!(_.find($scope.materialMember.emailsPhone, {email: $scope.materialMember.email.title}))) {
          $scope.materialMember.emailsPhone.push({
            email: $scope.materialMember.email.title,
            phoneNumber: $scope.newPhoneNumber
          });
          $scope.materialMember.email = {};
        }
      }
      else {
        if ($scope.textString) {
          if (!(_.find($scope.materialMember.emailsPhone, {email: $scope.textString}))) {
            $scope.materialMember.emailsPhone.push({email: $scope.textString, phoneNumber: $scope.newPhoneNumber});
            $scope.materialMember.email = {};
          }
        }
      }

      console.log($scope.material.isSkipInTender);
      if ($scope.material.isSkipInTender) {
        console.log('11111');
        $scope.materialMember.emailsPhone.slice(0,1);
        console.log($scope.materialMember.emailsPhone.slice(0,1));
      }
      $scope.newPhoneNumber = null;
      $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.removeSupplier = function(index) {
      $scope.materialMember.emailsPhone.splice(index,1);
    };

    $scope.supplierInputChanged = function (str) {
      $scope.textString = str;
    };


    // $scope.$watchGroup(['material.descriptions.length', 'materialSubmitted'], function (value) {
    //   $scope.materialDescriptionError = (value[0] <= 0 && value[1]);
    // });
    $scope.$watchGroup(['materialMember.emailsPhone.length', 'materialSubmitted'], function (value) {
      $scope.supplierError = (value[0] <= 0 && value[1]);
    });
    $scope.$watchGroup(['requirements.length', 'materialSubmitted'], function (value) {
      $scope.requireError = (value[0] <= 0 && value[1]);
    });

    $scope.supplierError = false;
    $scope.requireError = false;
    $scope.materialDescriptionError = false;
    $scope.createMaterialPackage = function (form) {
      $scope.materialSubmitted = true;
      if (form.$valid && !$scope.materialDescriptionError && !$scope.supplierError && !$scope.requireError) {
        materialPackageService.createMaterialPackage({
          material: $scope.material,
          requirements: $scope.requirements,
          suppliers: $scope.materialMember.emailsPhone,
          project: $stateParams.id
        }).$promise.then(function (data) {
          $('#newMaterialPackage').closeModal();
          if (!data.isSelect) {
            $state.go('materialRequest.viewMaterialRequest',{id : data.project, packageId : data._id});
          } else {
            $state.go('materialRequest.materialPackageInProcess',{id : data.project, packageId : data._id});
          }
          });
      }
    };

    $scope.activeHover = function($event){
        angular.element($event.currentTarget).addClass("item-hover")
    };
    $scope.removeHover = function($event) {
        angular.element($event.currentTarget).removeClass("item-hover")
    };

    $scope.goToMaterialPackageRequest = function(materialPackage) {
      if (($scope.currentTeam.type == 'builder' || $scope.currentTeam.type == 'supplier') && materialPackage.isSelect) {
        $state.go("materialRequest.materialPackageInProcess",{id: materialPackage.project, packageId: materialPackage._id});
      }
      else if ($scope.currentTeam.type == 'builder' && !materialPackage.isSelect) {
        $state.go("materialRequest.viewMaterialRequest",{id: materialPackage.project, packageId: materialPackage._id});
      }
      else if ($scope.currentTeam.type == 'supplier' && !materialPackage.isSelect) {
        $state.go("materialRequest.sendQuote",{id: materialPackage.project, packageId: materialPackage._id});
      }
    };

  });
