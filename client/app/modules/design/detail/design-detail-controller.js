angular.module('buiiltApp').controller('DesignDetailCtrl',
    function($scope, $rootScope,filterFilter,currentTeam,design,designService,currentUser,notificationService) {
      $scope.design = design;
      $scope.currentUser = currentUser;
      notificationService.markReadByPackage({_id : design._id}).$promise
        .then(function(res) {
        });
      $scope.complete = function() {
        designService.complete({_id : $scope.design._id}).$promise
          .then(function(res) {
            $scope.design = res;
            $('#modal_complete').closeModal();
          });
      };
});