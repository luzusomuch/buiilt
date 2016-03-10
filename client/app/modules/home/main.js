angular.module('buiiltApp').config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    
  .state('home', {
    url: '',
    templateUrl: '/app/modules/home/view.html'
  });
  
});