angular.module('buiiltApp')
  .directive('notification', function($compile){
    return {
      restrict: 'EA',
      replace : true,
      scope: {
        notification: '='
      },
      link : function(scope,element) {
        var params = {
          fromUser : '<span class="highlight">{{notification.fromUser.email}}</span> ',
          toUser : '<span class="highlight">{{notification.toUser.email}}</span>',
          element : '<span class="highlight">{{notification.element.name}}</span> ',
          quote: '<span class="highlight">{{notification.element.quote}}</span> ',
          packageName: '<span class="highlight">{{notification.element.package.name}}</span> ',
          time : '<span class="highlight">{{notification.createdAt | date : "yyyy/MM/dd hh:mm a"}}</span>'
        };

        var text;
        if (scope.notification.type === 'taskAssign') {
          text = params.fromUser + ' has assigned ' + params.toUser + ' to task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'taskRevoke') {
          text = params.fromUser + ' has revoked ' + params.toUser + ' from task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'taskReopened') {
          text = params.fromUser + ' has reopened task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'taskCompleted') {
          text = params.fromUser + ' has completed task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'CreateContractorPackage') {
          text = params.fromUser + ' has invited ' + params.toUser + 'to send a quote for ' + params.element.name;
        }
        if (scope.notification.type === 'SendQuoteToContractorPackage') {
          text = params.fromUser + ' has send quote ' + params.quote + ' to ' + params.toUser + ' in ' + param.packageName;
        }
        text += ' Click <a href="#!" ng-click="goToDetail(notification)">here</a> for more infomation';
        element.html(text).show();
        $compile(element.contents())(scope);
      },
      controller: function ($scope, $rootScope, taskService, authService, $state, notificationService) {
        $scope.goToDetail = function(notification) {
          notificationService.markAsRead({_id : notification._id}).$promise
            .then(function(res) {
              if (['taskAssign','taskReopened','taskCompleted'].indexOf(notification.type) != -1 ) {
                if (notification.element.type = 'staff') {
                  $state.go('staff.view',{
                    id : notification.element.project,
                    packageId : notification.element.package
                  })
                }
              }
            })
        }

      }
    }
  });