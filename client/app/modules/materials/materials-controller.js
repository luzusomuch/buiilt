angular.module('buiiltApp').controller('MaterialsCtrl',
  function ($scope, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService, materialPackages, team) {
    $scope.material = {
      descriptions: []
    };
    $scope.materialPackages = materialPackages;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam = team;
    $scope.filter = {isCompleted : false,isSelect: true};
    $scope.user = authService.getCurrentUser();
    $scope.requirements = [];
    $scope.submitted = false;

    // $scope.team = authService.getCurrentTeam();
    teamService.getCurrentTeam().$promise.then(function (data) {
      $scope.team = data;
      if ($scope.team) {
        if ($scope.team.type == 'buider') {
          materialPackageService.getMaterialByProjectForBuilder({'id': $stateParams.id}).$promise.then(function (data) {
            $scope.materials = data;
          });
          $scope.getMaterialPackageTenderByProject = function () {
            materialPackageService.getMaterialPackageTenderByProjectForBuilder({'id': $stateParams.id})
              .$promise.then(function (data) {
                $scope.materialPackagesInTender = data;
              });
          };

          $scope.getMaterialPackageInProcessByProject = function () {
            materialPackageService.getMaterialPackageInProcessByProjectForBuilder({'id': $stateParams.id})
              .$promise.then(function (data) {
                $scope.materialPackagesInProcess = data;
              });
          };
        }

        else if ($scope.team.type === 'supplier') {
          materialPackageService.getMaterialByProjectForSupplier({'id': $stateParams.id})
            .$promise.then(function (data) {
              $scope.materials = data;
            });
          $scope.getMaterialPackageTenderByProject = function () {
            materialPackageService.getMaterialPackageInTenderByProjectForSupplier({'id': $stateParams.id})
              .$promise.then(function (data) {
                $scope.materialPackagesInTender = data;
              });
          };

          $scope.getMaterialPackageInProcessByProject = function () {
            materialPackageService.getMaterialPackageInProcessByProjectForSupplier({'id': $stateParams.id})
              .$promise.then(function (data) {
                $scope.materialPackagesInProcess = data;
              });
          };
        }
      }
    });

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
      $scope.requirements.push({description: $scope.description, quantity: $scope.quantity});
      $scope.description = null;
      $scope.quantity = null;
    };

    $scope.removeRequire = function (index) {
      $scope.requirements.splice(index,1);
    };

    $scope.addDescription = function(description) {
      if (description) {
        $scope.material.descriptions.push(description);
        $scope.description1 = '';
      }
    };

    $scope.removeDescription = function(index) {
      $scope.material.descriptions.splice(index,1);
    };

    $scope.member = {
      email: {},
      emailsPhone: []
    };
    $scope.addNewSupplier = function () {
      if ($scope.member.email.title) {
        if (!(_.find($scope.member.emailsPhone, {email: $scope.member.email.title}))) {
          $scope.member.emailsPhone.push({
            email: $scope.member.email.title,
            phoneNumber: $scope.newPhoneNumber
          });
        }
      }
      else {
        if ($scope.textString) {
          if (!(_.find($scope.member.emailsPhone, {email: $scope.textString}))) {
            $scope.member.emailsPhone.push({email: $scope.textString, phoneNumber: $scope.newPhoneNumber});
          }
        }
      }
      $scope.newPhoneNumber = null;
      $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.removeSupplier = function(index) {
      $scope.member.emailsPhone.splice(index,1);
    };

    $scope.inputChanged = function (str) {
      $scope.textString = str;
    };


    $scope.$watchGroup(['material.descriptions.length', 'submitted'], function (value) {
      if (value[0] <= 0 && value[1])
        $scope.descriptionError = true;
      else
        $scope.descriptionError = false;
    });
    $scope.$watchGroup(['member.emailsPhone.length', 'submitted'], function (value) {
      if (value[0] <= 0 && value[1])
        $scope.supplierError = true;
      else
        $scope.supplierError = false;
    });
    $scope.$watchGroup(['requirements.length', 'submitted'], function (value) {
      if (value[0] <= 0 && value[1])
        $scope.requireError = true;
      else
        $scope.requireError = false;
    });


    $scope.createMaterialPackage = function (form) {
      $scope.submitted = true;
      if (form.$valid && !$scope.descriptionError && !$scope.supplierError && ! $scope.requireError) {
        materialPackageService.createMaterialPackage({
          material: $scope.material,
          requirements: $scope.requirements,
          suppliers: $scope.member.emailsPhone,
          project: $stateParams.id
        }).$promise.then(function (data) {
            $scope.materialPackages.push(data);
            $scope.material = {
              descriptions: []
            };
            $scope.requirements = [];
            $scope.member.emailsPhone = [];
            $scope.submitted = false  ;
            $('#newMaterialPackage').closeModal();
          });
      }
    };


  });
