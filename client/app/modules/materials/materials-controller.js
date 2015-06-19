angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService) {
    $scope.material = {};
    $scope.materialPackages = [];
    $scope.requirements = [];
    $scope.user = authService.getCurrentUser();
    // $scope.team = authService.getCurrentTeam();
    $scope.currentProject = $rootScope.currentProject;

    teamService.getCurrentTeam().$promise.then(function(data) {
        $scope.team = data;
        if ($scope.team) {
            if ($scope.team.type == 'buider') {
                $scope.getMaterialPackageTenderByProject = function() {
                    materialPackageService.getMaterialPackageTenderByProjectForBuilder({'id': $stateParams.id})
                    .$promise.then(function(data) {
                        $scope.materialPackagesInTender = data;
                    }); 
                };

                $scope.getMaterialPackageInProcessByProject = function() {
                    materialPackageService.getMaterialPackageInProcessByProjectForBuilder({'id': $stateParams.id})
                    .$promise.then(function(data) {
                        $scope.materialPackagesInProcess = data;
                    }); 
                };
            }
            else if($scope.team.type === 'contractor') {
                $scope.getContractorPackageTenderByProject = function() {
                    materialPackageService.getMaterialPackageTenderByProjectForSupplier({'id': $stateParams.id})
                    .$promise.then(function(data) {
                        $scope.contractorsInTender = data;
                    }); 
                };

                $scope.getContractorPackageInProcessByProject = function() {
                    materialPackageService.getMaterialPackageInProcessByProjectForSupplier({'id': $stateParams.id})
                    .$promise.then(function(data) {
                        $scope.contractorsInProcess = data;
                    }); 
                };
            }
        }
    });

    teamService.getSupplierTeam().$promise.then(function(data) {
        $scope.supplierTeams = data;
        var supplierTeamMember = [];
        angular.forEach($scope.supplierTeams, function(supplierTeam) {
          _.each(supplierTeam.leader, function(leader) {
            supplierTeamMember.push({_id: leader._id, email: leader.email});
          });
          _.each(supplierTeam.member, function(member){
            if (member._id) {
              supplierTeamMember.push({_id: member._id._id, email: member._id.email});
            }
          })
        });
        $scope.supplierTeamMember = supplierTeamMember;
    });

    $scope.addNewRequire = function() {
        $scope.requirements.push({description: $scope.description, quantity: $scope.quantity});
        $scope.description = null;
        $scope.quantity = null;
    };

    $scope.member = {
        email :{},
        emailsPhone: []
    };
    $scope.addNewSupplier = function() {
        console.log($scope.member.email);
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
        console.log($scope.member.emailsPhone);
        // $scope.emailsPhone.newEmail = null;
        $scope.newPhoneNumber = null;
        $scope.$broadcast('angucomplete-alt:clearInput');
    };

    $scope.inputChanged = function(str) {
        $scope.textString = str;
    };

    $scope.createMaterialPackage = function() {
        materialPackageService.createMaterialPackage({material: $scope.material, requirements: $scope.requirements, suppliers: $scope.member.emailsPhone, project: $stateParams.id}).$promise.then(function(data){
            $scope.materialPackages.push(data);
        });
    };

    
});