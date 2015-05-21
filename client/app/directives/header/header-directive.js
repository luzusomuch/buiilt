'use strict';

angular.module('buiiltApp')
  .directive('builtHeader', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/directives/header/header.html',
      controller: function ($scope, authService, $rootScope) {
        $scope.user = authService.getCurrentUser();
        $scope.menuTypes = {
          homeOwner: ['dashboard', 'builder', 'project'],
          contractor: ['dashboard', 'contractors', 'project'],
          buider: ['dashboard', 'client', 'contractors', 'materials', 'staff', 'project'],
          supplier: ['dashboard', 'contractors', 'project']
        };
        var loadMenu = function () {
          if ($scope.user) {
            $scope.tabs=$scope.menuTypes[$scope.user.type];
          }
        };
        loadMenu();
        
        $rootScope.$on('authUpdate', function(event,user){
          $scope.user=user;
          loadMenu();
        });
      }
    };
  });