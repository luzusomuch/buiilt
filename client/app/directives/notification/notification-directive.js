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
          fileName: '<span class="highlight">{{notification.element.file.title}}</span> ',
          packageName: '<span class="highlight">{{notification.element.package.name}}</span> ',
          place: '<span class="highlight">{{notification.element.uploadIn.name}}</span> ',
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
        if (scope.notification.type === 'create-contractor-package') {
          text = params.fromUser + ' has invited ' + params.toUser + 'to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'create-material-package') {
          text = params.fromUser + ' has invited ' + params.toUser + 'to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'send-quote') {
          text = params.fromUser + ' has send quote ' + params.quote + ' to ' + params.toUser + ' in ' + params.packageName;
        }
        if (scope.notification.type === 'send-addendum') {
          text = params.fromUser  + 'has add new addendum in pacakge ' + params.element;
        }
        if (scope.notification.type === 'edit-addendum') {
          text = params.fromUser  + 'has edit addendum in pacakge ' + params.element;
        }
        if (scope.notification.type === 'invite') {
          text = params.fromUser  + 'has invited new contractor in package ' + params.element;
        }
        if (scope.notification.type === 'invitation') {
          text = params.fromUser  + 'has invited you to send quote for package ' + params.element;
        }
        if (scope.notification.type === 'send-message') {
          text = params.fromUser  + 'has send you a message in package ' + params.element;
        }
        if (scope.notification.type === 'send-message-to-builder') {
          text = params.fromUser  + 'has send you a message in package ' + params.element;
        }
        if (scope.notification.type === 'select-quote') {
          text = params.fromUser  + 'has select you as a contractor for package ' + params.element;
        }
        if (scope.notification.type === 'send-defect') {
          text = params.fromUser  + 'has add new defect in package ' + params.element;
        }
        if (scope.notification.type === 'send-variation') {
          text = params.fromUser  + 'has add new variation in package ' + params.element;
        }
        if (scope.notification.type === 'send-invoice') {
          text = params.fromUser  + 'has add new invoice in package ' + params.element;
        }
        if (scope.notification.type === 'uploadDocument') {
          text = params.fromUser  + 'has add new document ' + params.fileName + ' in ' + params.place;
        }
        if (scope.notification.type === 'uploadNewDocumentVersion') {
          text = params.fromUser  + 'has update document ' + params.fileName + ' in project ' + params.place;
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