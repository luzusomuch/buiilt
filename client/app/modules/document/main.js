angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('document', {
        url: '/:id',
        template: '/app/modules/document/document.html',
        controller: 'DocumentCtrl'
    })
});