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

    _.forEach($scope.materialPackages,function(materialPackage) {
        materialPackage.isSupplier = (_.find(materialPackage.to, {_id: $scope.currentTeam._id})) ? true: false;
    });

  });
