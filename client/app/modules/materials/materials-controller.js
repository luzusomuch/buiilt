angular.module('buiiltApp').controller('MaterialsCtrl',
  function ($scope,socket, $stateParams, $rootScope, $timeout, $q, authService, teamService, materialPackageService, materialPackages, team) {
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
    $scope.inProgressTotal = 0;

    if ($scope.currentTeam.type == 'contractor' || $scope.currentTeam.type == 'homeOwner') {
      $state.go('team.manager');
    }

    _.forEach($scope.materialPackages,function(materialPackage) {
        materialPackage.isSupplier = (_.find(materialPackage.to, {_id: $scope.currentTeam._id})) ? true: false;
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

  });
