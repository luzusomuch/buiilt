angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('contractors', {
    url: '/:id/contractors',
    templateUrl: '/app/modules/contractors/contractors.html',
    controller: 'ContractorsCtrl',
    hasCurrentProject : true,
    authenticate : true,
    resolve: {
      team: function(authService){
        return authService.getCurrentTeam();
      }
    }
  })
});