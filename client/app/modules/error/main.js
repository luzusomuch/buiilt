angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
    .state('error', {
      url: '/error/:status',
      templateUrl: '/app/modules/error/views/index.html',
      controller: 'ErrorCtrl',
      noFooter : true,
      noHeader : true
    });
});