angular.module('buiiltApp')
  .directive('notification', function($compile){
    return {
      restrict: 'EA',
      replace : true,
      scope: {
        notification: '=',
        currentUser: '='
      },
      link : function(scope,element) {
        var params = {
          fromUser : function() {
            if (scope.notification.fromUser.email == scope.currentUser.email) {
              return '<span class="highlight">You</span> '
            }
            return '<span class="highlight">{{notification.fromUser.email}}</span> '
          },
          toUser : function () {
            if (scope.notification.toUser.email == scope.currentUser.email) {
              return '<span class="highlight">You</span> '
            }
            return '<span class="highlight">{{notification.toUser.email}}</span>';
          },
          team : function() {
            if (scope.notification.element._id == scope.currentUser.team._id) {
              return '<span class="highlight">your team</span> '
            }
            return 'team <span class="highlight">{{notification.element.name}}</span>';
          },
          element : '<span class="highlight">{{notification.element.name}}</span> ',
          quote: '<span class="highlight">{{notification.element.quote}}</span> ',
          fileName: '<span class="highlight">{{notification.element.file.title}}</span> ',
          packageName: '<span class="highlight">{{notification.element.package.name}}</span> ',
          place: '<span class="highlight">{{notification.element.uploadIn.name}}</span> ',
          builderOrHomeOwner: '<span class="highlight">{{(notification.element.to.type == "homeOwner") ? "home owner" : "builder"}}</span> ',
          time : '<span class="highlight">{{notification.createdAt | date : "yyyy/MM/dd hh:mm a"}}</span>'
        };
        var serviceArray = ['task-assign','task-revoke','task-reopened','task-completed','thread-assign','thread-message'];
        var teamArray = ['team-invite','team-accept','team-remove','team-leave','team-assign-leader'];
        var packageArray = ['staff-assign'];
        var builderNotificationArray = [ 'send-quote','invite','send-message-to-builder'];
        var contractorAndMaterialNotificationArray = ['create-contractor-package','create-material-package','send-addendum', 'edit-addendum','send-message','invitation'];
        var inProgressArray = ['select-quote'];
        var addOnNotification = ['send-variation','send-invoice','send-defect'];
        var documentNotification = ['uploadDocument','uploadNewDocumentVersion'];
        var getSref = function(notification) {
          if (serviceArray.indexOf(notification.type) != -1)  {
            switch (notification.element.type) {
              case 'staff' :
                return 'staff.view({id : notification.element.project, packageId : notification.element.package})';
              case 'builder' :
                return 'client({id : notification.element.project})';
              case 'contractor' :
                return 'contractorRequest.contractorPackageInProcess({id : notification.element.project, packageId : notification.element.package})';
              case 'material' :
                return 'materialRequest.materialPackageInProcess({id : notification.element.project, packageId : notification.element.package})';
              case 'variation' :
                return 'variationRequest.inProcess({id : notification.element.project, variationId : notification.element.package})';
            }
          }
          if (teamArray.indexOf(notification.type) != -1)  {
            return 'team.manager';
          }
          if (packageArray.indexOf(notification.type) != -1)  {
            switch (notification.referenceTo) {
              case 'StaffPackage' :
                return 'staff.view({id : notification.element.project, packageId : notification.element._id})';
            }
          }
          if (contractorAndMaterialNotificationArray.indexOf(notification.type) != -1) {
            switch(notification.referenceTo){
              case 'ContractorPackage': 
                return 'contractorRequest.sendQuote({id: notification.element.project, packageId: notification.element._id})';
              case 'MaterialPackage': 
                return 'materialRequest.sendQuote({id: notification.element.project, packageId: notification.element._id})';
              case 'Variation': 
                return 'variationRequest.sendQuote({id: notification.element.project, variationId: notification.element.package})';
            }
          }
          if (inProgressArray.indexOf(notification.type) != -1) {
            switch(notification.referenceTo){
              case 'ContractorPackage': 
                return 'contractorRequest.contractorPackageInProcess({id: notification.element.project, packageId: notification.element._id})';
              case 'MaterialPackage': 
                return 'materialRequest.materialPackageInProcess({id: notification.element.project, packageId: notification.element._id})';
              case 'Variation': 
                return 'variationRequest.inProcess({id: notification.element.project, variationId: notification.element.package})';
            }
          }
          if (addOnNotification.indexOf(notification.type) != -1) {
            switch(notification.referenceTo){
              case 'ContractorPackage': 
                return 'contractorRequest.contractorPackageInProcess({id: notification.element.project, packageId: notification.element._id})';
              case 'MaterialPackage': 
                return 'materialRequest.materialPackageInProcess({id: notification.element.project, packageId: notification.element._id})';
              case 'Variation': 
                return 'variationRequest.inProcess({id: notification.element.project, variationId: notification.element._id})';
              case 'BuilderPackage': 
                return 'client({id: notification.element.project})';
            }
          }
          if (documentNotification.indexOf(notification.type) != -1) {
            switch(notification.referenceTo){
              case 'DocumentInProject': 
                return 'projects.view({id: notification.element.projectId})';
              case 'DocumentContractorPackage': 
                return 'contractorRequest.contractorPackageInProcess({id: notification.element.projectId, packageId: notification.element.uploadIn._id})';
              case 'DocumentMaterialPackage': 
                return 'materialRequest.materialPackageInProcess({id: notification.element.projectId, packageId: notification.element.uploadIn._id})';
              case 'DocumentStaffPackage': 
                return 'staff.view({id: notification.element.projectId, packageId: notification.element.uploadIn._id})';
              case 'DocumentVariation': 
                return 'variationRequest.inProcess({id: notification.element.projectId, packageId: notification.element.uploadIn._id})';
              case 'DocumentBuilderPackage': 
                return 'client({id: notification.element.projectId})';
            }
          }
          if (builderNotificationArray.indexOf(notification.type) != -1) {
            switch(notification.referenceTo){
              case 'ContractorPackage': 
                return 'contractorRequest.viewContractorRequest({id: notification.element.package.project, packageId: notification.element.package._id})';
              case 'MaterialPackage': 
                return 'materialRequest.viewMaterialRequest({id: notification.element.package.project, packageId: notification.element.package._id})';
              case 'Variation': 
                return 'variationRequest.viewRequest({id: notification.element.package.project, packageId: notification.element.package._id})';
            }
          }
          if (notification.type == 'create-builder-package') {
            return 'client({id: notification.element.project})';
          }
          if (notification.type == 'cancel-package') {
            switch(notification.referenceTo){
              case 'ContractorPackage':
                return 'contractors({id: notification.element.package.project})';
              case 'MaterialPackage':
                return 'materials({id: notification.element.package.project})';
              case 'Variation':
                return 'dashboard({id: notification.element.package.project})';
            }
          }
          if (notification.type == 'send-thanks-to-loser') {
            return 'team.manager';
          }
        };

        var text;
        if (scope.notification.type === 'task-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-revoke') {
          text = params.fromUser() + ' has revoked ' + params.toUser() + ' from task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-reopened') {
          text = params.fromUser() + ' has reopened task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-completed') {
          text = params.fromUser() + ' has completed task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-remove') {
          text = params.fromUser() + ' has removed ' + params.toUser() + ' to thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-message') {
          text = params.fromUser() + ' has send new message in thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-invite') {
          text = params.fromUser() + ' has invite you to ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-accept') {
          text = params.fromUser() + ' has accept to join to ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-remove') {
          text = params.fromUser() + ' has remove ' + params.toUser() + ' to ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-leave') {
          text = params.fromUser() + ' has leaved ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'staff-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to package '+ params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-assign-leader') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to admin in '+ params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'create-contractor-package') {
          text = params.fromUser() + ' has invited ' + params.toUser() + 'to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'create-material-package') {
          text = params.fromUser() + ' has invited ' + params.toUser() + 'to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'send-quote') {
          text = params.fromUser() + ' has send quote ' + params.quote + ' to ' + params.toUser() + ' in ' + params.packageName;
        }
        if (scope.notification.type === 'send-addendum') {
          text = params.fromUser()  + 'has add new addendum in ' + params.element;
        }
        if (scope.notification.type === 'edit-addendum') {
          text = params.fromUser()  + 'has edit addendum in ' + params.element;
        }
        if (scope.notification.type === 'invite') {
          text = params.fromUser()  + 'has invited new person in ' + params.packageName;
        }
        if (scope.notification.type === 'invitation') {
          text = params.fromUser()  + 'has invited you to send quote for ' + params.element;
        }
        if (scope.notification.type === 'send-message') {
          text = params.fromUser()  + 'has send you a message in ' + params.element;
        }
        if (scope.notification.type === 'send-message-to-builder') {
          text = params.fromUser()  + 'has send you a message in ' + params.element;
        }
        if (scope.notification.type === 'select-quote') {
          text = params.fromUser()  + 'has select you for ' + params.element;
        }
        if (scope.notification.type === 'send-defect') {
          text = params.fromUser()  + 'has add new defect in ' + params.element;
        }
        if (scope.notification.type === 'send-variation') {
          text = params.fromUser()  + 'has add new variation in ' + params.element;
        }
        if (scope.notification.type === 'send-invoice') {
          text = params.fromUser() + 'has add new invoice in ' + params.element;
        }
        if (scope.notification.type === 'uploadDocument') {
          text = params.fromUser()  + 'has add new document ' + params.fileName + ' in ' + params.place;
        }
        if (scope.notification.type === 'uploadNewDocumentVersion') {
          text = params.fromUser()  + 'has update document ' + params.fileName + ' in project ' + params.place;
        }
        if (scope.notification.type == 'create-builder-package') {
          text = params.fromUser() + ' invited you become a ' + params.builderOrHomeOwner + ' for project' + params.element;
        }
        if (scope.notification.type == 'send-thanks-to-loser') {
          text = params.packageName + 'has been awarded to another company. ' + params.fromUser() + ' thanks you for provide a quote';
        }
        if (scope.notification.type == 'cancel-package') {
          text = params.fromUser() + 'has been cancel package ' + params.packageName;
        }

        scope.notification.sref = getSref(scope.notification);

        element.html('<a ui-sref="{{notification.sref}}" ui-sref-opts="{reload: true}" ng-click="click(notification)" style="padding: 0px"><div class="_notification"><p>' + text + '</p></div></a>').show();
        $compile(element.contents())(scope);
      },
      controller: function ($scope, $rootScope, taskService, authService, $state, notificationService) {
        $scope.click = function(notification) {
          notificationService.markAsRead({_id : notification._id}).$promise
            .then(function(res) {
              $rootScope.$emit('notification:read',notification);
            })
        };
      }
    }
  })
  .directive('spNotification',function() {
    return {
      restrict: 'EA',
      replace : true,
      templateUrl: 'app/directives/notification/notification.html',
      controller: [
        '$scope', '$rootScope','notificationService','socket','authService',
        function ($scope, $rootScope, notificationService,socket,authService ) {
          $scope.slimScrollOptions = {height: '390px'};
          $scope.readMore = true;
          $scope.currentUser = $rootScope.user;
          $scope.notifications = [];
          var limit = 10;

          notificationService.getTotal().$promise
            .then(function(res) {
              $scope.total = res.count;
            });
          var getNotifications = function(limit) {
            if ($scope.readMore) {
              notificationService.get({limit : limit}).$promise
                .then(function(res) {
                  $scope.notifications = res;
                  if (limit > res.length) {
                    $scope.readMore = false;
                  }
                })
            }
          };

          $scope.loadMore = function() {
            limit += 10;
            getNotifications(limit);
          };

          $scope.markAllAsRead = function() {
            notificationService.markAllAsRead().$promise
              .then(function(res) {
                $scope.notifications = [];
                $scope.total = 0;
                $rootScope.$emit('notification:allRead');
                $('#slimScrollDiv').hide();
              })
          };

          $scope.$watch('total',function(value) {
            if (value == 0) {
              $('.slimScrollDiv').hide();
            } else
              $('.slimScrollDiv').show();
          })

          $rootScope.$on('notification:read',function(event,notification) {
            _.remove($scope.notifications,{_id : notification._id});
            $scope.total--;
          });

          getNotifications(limit);
          socket.on('notification:new', function (notification) {
            if (notification) {
              $scope.notifications.unshift(notification);
              $scope.total++;
              $scope.$apply();
            }
          });

          socket.on('notification:read',function(notifications) {
            _.forEach(notifications,function(notification) {
              _.remove($scope.notifications,{_id : notification._id});
            });
            $scope.total -= notifications.length;

          })
        }]

    }
  });