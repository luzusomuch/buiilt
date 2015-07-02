angular.module('buiiltApp').controller('ContractorsCtrl',
  function($scope, team, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService,contractorPackages) {
    $scope.contractor = {
      descriptions : []
    };
    $scope.contractorPackages = contractorPackages;
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam = team;
    $scope.user = authService.getCurrentUser();
    $scope.filter = {isCompleted : false, isAccept : true};
    $scope.submitted = false;
    // $scope.isBuilder = ($scope.contractorPackages.owner == $scope.currentTeam._id) ? true : false;
    // $scope.canSee = (_.find(contractorPackages.to, {_id: $scope.currentTeam._id})) ? true : false;
    // $scope.team = authService.getCurrentTeam();

    _.forEach($scope.contractorPackages,function(contractorPackage) {
        contractorPackage.isContractor = (_.find(contractorPackage.to, {_id: $scope.currentTeam._id})) ? true: false;
    });

});

