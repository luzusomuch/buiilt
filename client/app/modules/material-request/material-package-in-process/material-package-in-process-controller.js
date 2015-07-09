angular.module('buiiltApp')
.controller('MaterialPackageInProcessCtrl', function($scope, $state, $stateParams, filterFilter, $cookieStore, currentTeam, materialRequest, fileService, authService, userService,materialRequestService) {
  /**
   * quote data
   */
  $scope.materialRequest = materialRequest;
  $scope.currentTeam = currentTeam;
  $scope.materialRequest.winnerTeam._id.member  = filterFilter($scope.materialRequest.winnerTeam._id.member , {status : 'Active'});
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  $scope.complete = function() {
    materialRequestService.complete({_id : $scope.materialRequest._id}).$promise
      .then(function(res) {
        $scope.materialRequest = res;
        $('#modal_complete').closeModal();
      })
  }
});