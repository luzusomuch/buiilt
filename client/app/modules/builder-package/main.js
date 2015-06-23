angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('builderPackages', {
    url: '/builder-packages',
    template: '<ui-view/>'
  })
  .state('builderPackages.sendQuote', {
    url: '/:id/send-quote/:packageId',
    templateUrl: '/app/modules/builder-package/send-quote/send-quote.html',
    controller: 'SendQuoteBuilderPackageCtrl',
    // authenticate : true,
    hasCurrentProject : true,
    resolve: {
      builderPackage: function($stateParams, builderPackageService){
        return builderPackageService.findOne($stateParams.id);
      }
    }
  });
});