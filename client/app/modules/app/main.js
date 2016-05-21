angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    
    .state('app', {
        url: '/app/',
        controller: "appCtrl",
    })
});