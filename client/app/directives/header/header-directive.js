'use strict';

angular.module('buiiltApp')
  .directive('builtHeader', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/directives/header/header.html',
      controller: function ($scope, authService, $rootScope) {
        $scope.user = authService.getCurrentUser();
        $scope.menuTypes = {
          homeOwner: [{sref:'dashboard',label:'dashboard'},
            {sref:'client',label:'builder'},
            {sref:'project',label:'project'}],
          contractor: [{sref:'dashboard',label:'dashboard'},
            {sref:'contractors',label:'contractors'},
            {sref:'project',label:'project'}],
          buider: [{sref:'dashboard',label:'dashboard'},
            {sref:'client',label:'client'},
            {sref:'contractors',label:'contractors'},
            {sref:'materials',label:'materials'},
            {sref:'staff',label:'staff'},
            {sref:'project',label:'project'}],
          supplier: [{sref:'dashboard',label:'dashboard'},
            {sref:'contractors',label:'contractors'},
            {sref:'project',label:'project'}]
        };
        $scope.loadMenu = function () {
          console.log($scope.user);
          if ($scope.user._id) {
            $scope.tabs=$scope.menuTypes[$scope.user.type];
          }
        };
        $scope.loadMenu();
        
      }
    };
  });