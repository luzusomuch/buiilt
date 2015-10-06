angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('document', {
        url: '/:id',
        templateUrl: '/app/modules/document/document.html',
        controller: 'DocumentCtrl'
    });
});