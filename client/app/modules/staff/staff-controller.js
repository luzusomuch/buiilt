angular.module('buiiltApp').controller('StaffCtrl', function($scope, $timeout, $q, authService, $rootScope,staffPackageService,filterFilter,currentTeam) {
    $scope.user = authService.getCurrentUser();
    $scope.currentProject = $rootScope.currentProject;
    $scope.currentTeam =  currentTeam;
    $scope.package = {
      staffs : []
    };
    $scope.submitted = false;
    staffPackageService.get({id : $scope.currentProject._id}).$promise
      .then(function(staffPackages) {
        $scope.staffPackages = staffPackages;
      });
  $scope.staffSelectedFunction = function(selected) {
    $scope.package.staffs.push(selected.originalObject);
  };
  $scope.currentTeam.member  = filterFilter($scope.currentTeam.member, {status : 'Active'});
    $scope.save = function(form) {
      $scope.submitted = true;
      if (form.$valid) {
        if ($scope.package.staffs.length <= 0) {
          alert("Make sure you have assign package to staff");
          return;
        }
        staffPackageService.create({id : $scope.currentProject._id},$scope.package).$promise
          .then(function(res) {
            $scope.staffPackages.push(res);
            $scope.package = {};
            $scope.submitted = false;
            $('#newWorkPackage').closeModal();
          })
      }
    }
});
