angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materials', {
    url: '/:id/materials',
    templateUrl: '/app/modules/materials/materials.html',
    controller: 'MaterialsCtrl',
    hasCurrentProject : true
  });
});