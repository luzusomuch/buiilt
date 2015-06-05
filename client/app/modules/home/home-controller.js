angular.module('buiiltApp').controller('HomeCtrl',
  function($scope, $timeout, $q,projectsByUser,projectsByBuilder) {
    $scope.projectsByUser = projectsByUser;
    $scope.projectsByBuilder = projectsByBuilder;
  });