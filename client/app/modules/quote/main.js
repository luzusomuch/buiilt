angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('quote', {
    url: '/quote',
    templateUrl: '/app/modules/quote/quote.html',
    controller: 'QuoteCtrl'
  })
  .state('quote.form', {
    url : '/:id',
    templateUrl: '/app/modules/quote/create-quote/form.html',
    controller: 'FormQuoteCtrl',
    resolve: {
        project: function($stateParams, projectService) {
            return projectService.get({ id: $stateParams.id});
        }
    }
  })
  // .state('project.view', {
  //   url : '/:id',
  //   templateUrl: '/app/modules/project/view-project/view.html',
  //   controller: 'ViewProjectCtrl',
  //   resolve: {
  //     project: function($stateParams, projectService) {
  //       return projectService.get({ id :$stateParams.id});
  //     }
  //   }
  // })
  ;
});