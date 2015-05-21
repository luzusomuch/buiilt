'use strict';

angular.module('buiiltApp')
        .directive('builtFooter', function() {
          return {
            restrict: 'E',
            templateUrl: 'app/directives/footer/footer.html'
          };
        });