angular.module('buiiltApp').controller('MaterialsCtrl', function($scope, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService) {
    $scope.material = {};
    $scope.requirements = [];
    $scope.emailsPhone = [];
    $scope.user = authService.getCurrentUser();
    if ($scope.user) {
        teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
            $scope.team = team;
        });
    }
    $scope.currentProject = $rootScope.currentProject;

    $scope.addNewRequire = function() {
        $scope.requirements.push({description: $scope.description, quantity: $scope.quantity});
    };

    $scope.addNewSupplier = function() {
        $scope.emailsPhone.push({email: $scope.newEmail, phoneNumber: $scope.newPhoneNumber});
    };

    $scope.createMaterialPackage = function() {
        materialPackageService.createMaterialPackage({material: $scope.material, requirements: $scope.requirements, suppliers: $scope.emailsPhone, project: $stateParams.id}).$promise.then(function(data){

        });
    };

});