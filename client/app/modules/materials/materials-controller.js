angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService) {
    $scope.material = {};
    $scope.materialPackages = [];
    $scope.requirements = [];
    $scope.emailsPhone = [];
    $scope.user = authService.getCurrentUser();
    $scope.team = authService.getCurrentTeam();
    $scope.currentProject = $rootScope.currentProject;

    $scope.addNewRequire = function() {
        $scope.requirements.push({description: $scope.description, quantity: $scope.quantity});
    };

    $scope.addNewSupplier = function() {
        $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
    };

    $scope.createMaterialPackage = function() {
        materialPackageService.createMaterialPackage({material: $scope.material, requirements: $scope.requirements, suppliers: $scope.emailsPhone, project: $stateParams.id}).$promise.then(function(data){
            $scope.materialPackages.push(data);
        });
    };

    $scope.getMaterialPackageTenderByProject = function() {
        materialPackageService.getMaterialPackageTenderByProject({'id': $stateParams.id})
        .$promise.then(function(data) {
            $scope.materialPackagesInTender = data;
        }); 
    };

    $scope.getMaterialPackageInProcessByProject = function() {
        materialPackageService.getMaterialPackageInProcessByProject({'id': $stateParams.id})
        .$promise.then(function(data) {
            $scope.materialPackagesInProcess = data;
        }); 
    };
});