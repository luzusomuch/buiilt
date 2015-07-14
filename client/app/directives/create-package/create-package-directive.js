'use strict';
angular.module('buiiltApp').directive('createPackage', function(){
  return {
    restrict: 'EA',
    templateUrl: 'app/directives/create-package/create-package.html',
    controller: function($scope, $rootScope,$state,$stateParams, $cookieStore, staffPackageService,teamService,contractorService,materialPackageService) {
      $scope.currentTeam = $rootScope.currentTeam;
      $scope.available = [];
      $scope.package = {
        staffs : [],
        descriptions: []
      };
      $scope.submitted = false;
      var getAvailableAssign =  function() {
        if ($scope.currentTeam) {
          _.forEach($scope.currentTeam.member, function(member) {
            if (member.status == 'Active') {
              $scope.available.push(member._id);
            }
          });
        }
      };

      getAvailableAssign();

      $scope.addDescription = function(description) {
        if (description) {
          $scope.package.descriptions.push(description);
          $scope.description = '';
        }
      };

      $scope.removeDescription = function(index) {
        $scope.package.descriptions.splice(index,1);
        $scope.description = '';
      };

      $scope.staffAssign = function(staff,index) {
        $scope.package.staffs.push(staff);
        $scope.available.splice(index,1);
      };

      $scope.staffRevoke = function(assignee,index) {
        $scope.available.push(assignee);
        $scope.package.staffs.splice(index,1);
      };



      $scope.save = function(form) {
        $scope.submitted = true;
        $scope.$watchGroup(['package.descriptions.length','submitted'],function(value) {
          $scope.descriptionError = (value[0] <= 0 && value[1]);
        });

        $scope.$watchGroup(['package.staffs.length','submitted'],function(value) {
          $scope.assgineesError = (value[0] <= 0 && value[1]);

        });
        if (form.$valid && !$scope.assgineesError && !$scope.descriptionError ) {
          staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
            .then(function(res) {
              $state.go('staff.view',{id : res.project, packageId : res._id});
              //$scope.staffPackages.push(res);
              //$scope.package = {
              //  staffs : [],
              //  descriptions: []
              //};
              //$scope.available = [];
              //$scope.submitted = false;
              //getAvailableAssign();
              $('#newWorkPackage').closeModal();
            })
        }
      }


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
          }
        }
        else {
          if ($scope.textString) {
            if (!(_.find($scope.materialMember.emailsPhone, {email: $scope.textString}))) {
              $scope.materialMember.emailsPhone.push({email: $scope.textString, phoneNumber: $scope.newPhoneNumber});
            }
          }
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
              $state.go('materialRequest.viewMaterialRequest',{id : data.project, packageId : data._id});
              $('#newMaterialPackage').closeModal();
            });
        }
      };
    }
  }
});