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

    // $scope.team = authService.getCurrentTeam();



});

