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
  .directive('scrollToBottom',["$timeout", function($timeout) {
    return {
      restrict: 'AE',
      scope : {
        scrollToBottom : '='
      },
      link : function(scope,element) {
        scope.$watchCollection('scrollToBottom',function(value) {
          if (value) {
            $timeout(function() {
              $(element).scrollTop($(element)[0].scrollHeight);
            }, 500);
          }
        });
      }
    };
  }])
  .directive("compareTo", function() {
    return {
      require: "ngModel",
      scope: {
        confirmPassword: "=compareTo"
      },
      link: function(scope, element, attributes, modelVal) {

        modelVal.$validators.compareTo = function(val) {
          return val == scope.confirmPassword;
        };

        scope.$watch("confirmPassword", function() {
          modelVal.$validate();
        });
      }
    };
  });