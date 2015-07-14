angular.module('buiiltApp')
.controller('MaterialPackageInProcessCtrl', function($scope, $state, $stateParams, filterFilter, $cookieStore, currentTeam, materialRequest, fileService, authService, userService,materialRequestService,notificationService) {
  /**
   * quote data
   */
  $scope.materialRequest = materialRequest;
  $scope.currentTeam = currentTeam;
  $scope.materialRequest.winnerTeam._id.member  = filterFilter($scope.materialRequest.winnerTeam._id.member , {status : 'Active'});
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  if (currentTeam.type == 'contractor' ||
   currentTeam.type == 'homeOwner' || 
   contractorRequest.owner._id != currentTeam._id || 
   contractorRequest.winnerTeam._id._id != currentTeam._id
    ) {
    $state.go('team.manager');
  }

  notificationService.markReadByPackage({_id : materialRequest._id}).$promise
    .then(function(res) {
    });

  $scope.complete = function() {
    materialRequestService.complete({_id : $scope.materialRequest._id}).$promise
      .then(function(res) {
        $scope.materialRequest = res;
        $('#modal_complete').closeModal();
      })
  }
});