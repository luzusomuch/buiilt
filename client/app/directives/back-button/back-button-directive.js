'use strict';

angular.module('buiiltApp')
.directive('backButton', function(){
    return {
        restrict: 'A',

        link: function(scope, element, attrs) {
            element.bind('click', goBack);

            /*Go back to previous state*/
            function goBack() {
                history.back();
                scope.$apply();
            }
        }
    }
});