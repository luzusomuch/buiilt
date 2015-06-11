angular.module('buiiltApp').config(function($stateProvider) {
  $stateProvider
  .state('notification', {
    url: '/notification',
    template: '<ui-view/>'
  })
  .state('notification.view', {
    url: '/:id',
    templateUrl: '/app/modules/notification/view-notification/view.html',
    controller: 'ViewNotificationCtrl'
  });
});