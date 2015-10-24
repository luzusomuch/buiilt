angular.module('buiiltApp').controller('ViewNotificationCtrl',
  function($scope, $stateParams, $timeout, $q,notifications, notificationService, $rootScope) {
    $scope.notifications = notifications;
    
    $scope.markAllAsRead = function() {
      notificationService.markAllAsRead().$promise
        .then(function(res) {
          $scope.notifications = res;
        });
    };
  });