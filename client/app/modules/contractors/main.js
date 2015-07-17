angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractors', {
    url: '/:id/contractors',
    templateUrl: '/app/modules/contractors/contractors.html',
    controller: 'ContractorsCtrl',
    hasCurrentProject : true,
    authenticate : true,
    // canAccess : ['builder','contractor'],
    resolve: {
      team: function(authService){
        return authService.getCurrentTeam().$promise;
      },
      contractorPackages : function(contractorService,$stateParams) {
        return contractorService.get({id : $stateParams.id}).$promise;
      }
    }
  })
});