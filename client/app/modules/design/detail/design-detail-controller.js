angular.module('buiiltApp').controller('DesignDetailCtrl',
    function($scope, $rootScope,filterFilter,currentTeam,staffPackage,staffPackageService,currentUser,notificationService) {
      $scope.staffPackage = staffPackage;
      $scope.currentUser = currentUser;
      notificationService.markReadByPackage({_id : staffPackage._id}).$promise
        .then(function(res) {
        });
      $scope.complete = function() {
        staffPackageService.complete({_id : $scope.staffPackage._id}).$promise
          .then(function(res) {
            $scope.staffPackage = res;
            $('#modal_complete').closeModal();
          })
      }
});