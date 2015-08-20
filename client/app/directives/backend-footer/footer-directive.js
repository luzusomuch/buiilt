'use strict';

angular.module('buiiltApp')
        .directive('builtFooter', function() {
          return {
            restrict: 'E',
            templateUrl: 'app/directives/backend-footer/footer.html',
            controller: function($rootScope) {
                $rootScope.footerHeight = $('footer').outerHeight();
            }
          };
        });