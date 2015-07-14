angular.module('buiiltApp')
  .controller('ContractorPackageInProcessCtrl',
  function($scope, $state, $stateParams, filterFilter, currentTeam, $cookieStore, fileService, authService, userService, contractorRequest, contractorRequestService, quoteService,notificationService) {
    /**
     * quote data
     */
    $scope.currentTeam = currentTeam;
    $scope.contractorRequest = contractorRequest;
    $scope.contractorRequest.winnerTeam._id.member  = filterFilter($scope.contractorRequest.winnerTeam._id.member , {status : 'Active'});

    $scope.currentUser = {};
    if ($cookieStore.get('token')) {
      $scope.currentUser = userService.get();
    }

    if (currentTeam.type == 'supplier' || currentTeam.type == 'homeOwner') {
      $state.go('team.manager');
    }
    else if (currentTeam.type == 'builder') {
      if (contractorRequest.owner._id != currentTeam._id) {
        $state.go('team.manager');
      }
    }
    else {
      if (contractorRequest.winnerTeam._id._id != currentTeam._id) {
        $state.go('team.manager');
      }
    }

    notificationService.markReadByPackage({_id : contractorRequest._id}).$promise
      .then(function(res) {
      });

    $scope.complete = function() {
      contractorRequestService.complete({_id : $scope.contractorRequest._id}).$promise
        .then(function(res) {
          $scope.contractorRequest = res;
          $('#modal_complete').closeModal();
        })
    }
});