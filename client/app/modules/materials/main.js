angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('materials', {
      url: '/:id/materials',
      templateUrl: '/app/modules/materials/materials.html',
      controller: 'MaterialsCtrl',
      hasCurrentProject : true,
      authenticate : true,
      // canAccess : ['builder','material'],
      resolve: {
        team: function(authService){
          return authService.getCurrentTeam().$promise;
        },
        materialPackages : function(materialPackageService,$stateParams) {
          return materialPackageService.get({id : $stateParams.id}).$promise;
        }
      }
    });
});