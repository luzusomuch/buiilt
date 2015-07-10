angular.module('buiiltApp').controller('HomeCtrl',
  function($scope, $timeout, $q,$state) {
    $state.go('team.manager');
  });