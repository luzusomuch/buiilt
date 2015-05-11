angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('materials', {
    url: '/materials',
    templateUrl: '/app/modules/materials/materials.html',
    controller: 'MaterialsCtrl'
  });
});