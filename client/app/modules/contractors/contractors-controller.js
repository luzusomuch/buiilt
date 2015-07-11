angular.module('buiiltApp').controller('ContractorsCtrl',
  function($scope,socket, team, $stateParams, $rootScope, $timeout, $q, contractorService, authService, projectService, teamService,contractorPackages) {
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
        var contractorPackage = _.find($scope.contractorPackages,{_id : notification.element.package});
        if (contractorPackage) {
          contractorPackage.__v++;
        }
      }
    });

    // End Real time process

});

