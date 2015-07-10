'use strict';
angular.module('buiiltApp')
  .directive('spSocket', [function () {
    return {
      restrict: 'AE',
      controller:['socket','authService',function(socket, authService){
        authService.getCurrentUser().$promise
          .then(function(user) {
            socket.emit('join',user._id);
          });
      }]
    };
  }])
  .directive('scrollToBottom',[function() {
    return {
      restrict: 'AE',
      scope : {
        scrollToBottom : '='
      },
      link : function(scope,element,attrs) {
        scope.$watchCollection('scrollToBottom',function(value) {
          if (value) {
            $(element).scrollTop($(element)[0].scrollHeight);
          }
        });
      }
    }
  }]);