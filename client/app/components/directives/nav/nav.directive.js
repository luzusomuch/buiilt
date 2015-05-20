'use strict';

angular.module('buiiltApp')
        .directive('builtNav', function() {
          return {
            restrict: 'E',
            scope: {
              //location: '=results'
            },
            replace: true,
            //transclude: true,
            templateUrl: 'app/components/directives/nav/nav.html',
            controller: ['$scope', function($scope, $location) {
                $scope.tabs = ['DASHBOARD', 'CLIENT', 'CONTRACTORS', 'MATERIALS', 'STAFF', 'PROJECT'];
                console.log($location);
                $scope.switchTab = function(index) {
                  switch (index) {
                    case 0:
                      $location.path('/dashboard');
                      break;
                    case 1:
                      $location.path('/client');
                      break;
                    case 2:
                      $location.path('/contractors');
                      break;
                    case 3:
                      $location.path('/materials');
                      break;
                    case 4:
                      $location.path('/staff');
                      break;
                    case 5:
                      $location.path('/project');
                      break;
                  }
                };
              }]
          };
        });