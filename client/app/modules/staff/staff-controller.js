angular.module('buiiltApp').controller('StaffCtrl', function($scope, $timeout, $q, authService, $rootScope, teamService) {
    $scope.user = authService.getCurrentUser();
    if ($scope.user) {
        teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
            $scope.team = team;
        });
    }
    $scope.currentProject = $rootScope.currentProject;
    $scope.staffPackage = staffPackage;
  console.log($scope.currentProject)
  console.log(staffPackage)

    $scope.save = function(form) {
      if (form.$valid) {
        staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
          .then(function(res) {
            console.log(res);
          })
      }
    }
});
