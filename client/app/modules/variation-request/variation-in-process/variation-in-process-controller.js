angular.module('buiiltApp')
  .controller('VariationInProcessCtrl', function($scope, $state, $stateParams, filterFilter, currentTeam, $cookieStore, fileService, authService, userService, variationRequest, variationRequestService, quoteService) {
    /**
     * quote data
     */
    // $scope.allItemsText = 'All items';
    $scope.currentTeam = currentTeam;
    $scope.variationRequest = variationRequest;
    $scope.variationRequest.to._id.member  = filterFilter($scope.variationRequest.to._id.member , {status : 'Active'});
    $scope.currentUser = {};
    if ($cookieStore.get('token')) {
      $scope.currentUser = userService.get();
    }

    if (variationRequest.owner._id != currentTeam._id || variationRequest.to._id._id != currentTeam._id) {
      $state.go('team.manager');
    }

    $scope.complete = function() {
      variationRequestService.complete({_id : $scope.variationRequest._id}).$promise
        .then(function(res) {
          $scope.variationRequest = res;
          $('#modal_complete').closeModal();
        })
    }

});