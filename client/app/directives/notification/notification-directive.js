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
              return '<span class="highlight">You</span> ';
            }
            return '<span class="highlight">{{(notification.fromUser.firstName) ? notification.fromUser.firstName + " " + notification.fromUser.lastName : notification.fromUser.email}}</span> ';
          },
          toUser : function () {
            if (scope.notification.toUser.email == scope.currentUser.email) {
              return '<span class="highlight">You</span> ';
            }
            return '<span class="highlight">{{(notification.toUser.firstName) ? notification.toUser.firstName + " "+ notification.toUser.lastName : notification.toUser.email}}</span>';
          },
          team : function() {
            if (scope.notification.element._id == scope.currentUser.team._id) {
              return '<span class="highlight">your team</span> ';
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
              case 'people':
                return 'people({id: notification.element.project})';
              case 'board':
                return 'board({id: notification.element.project})';
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
              case 'documentInpeople':
                return 'people({id: notification.element.package.belongTo})';
              case 'documentInboard':
                return 'board({id: notification.element.package.belongTo})';
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
          if (notification.type == 'decline-quote') {
            return 'team.manager';
          }

          // NEW VERSION
          if (notification.referenceTo == 'people-chat') {
            return 'people({id: notification.element.project})';
          }
          if (notification.type == 'NewBoard') {
            return 'board({id: notification.element.project})';
          }
          if (notification.type == 'InvitePeopleToBoard') {
            return 'board({id: notification.element.project})'; 
          }
          if (notification.referenceTo == 'board-chat') {
            return 'board({id: notification.element.project})';
          }
          if (notification.type == 'invite-people') {
            return 'people({id: notification.element.project})';
          }
          if (notification.type == 'winner-tender') {
            return 'people({id: notification.element.project})';
          }
          if (notification.type == 'loser-tender') {
            return 'team.manager';
          }
        };

        var text;
        if (scope.notification.type === 'task-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to the task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-revoke') {
          text = params.fromUser() + ' has removed ' + params.toUser() + ' from the task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-reopened') {
          text = params.fromUser() + ' has reopened the task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'task-completed') {
          text = params.fromUser() + ' has completed the task ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to the thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-remove') {
          text = params.fromUser() + ' has removed ' + params.toUser() + ' from the thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'thread-message') {
          text = params.fromUser() + ' has posted a new message in the thread ' + params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-invite') {
          text = params.fromUser() + ' has invited you to the team ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-accept') {
          text = params.fromUser() + ' has accepted to join the team ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-remove') {
          text = params.fromUser() + ' has removed ' + params.toUser() + ' from ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-leave') {
          text = params.fromUser() + ' has left the team ' + params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'staff-assign') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' to the package '+ params.element + ' at ' + params.time;
        }
        if (scope.notification.type === 'team-assign-leader') {
          text = params.fromUser() + ' has assigned ' + params.toUser() + ' as an administrator in '+ params.team() + ' at ' + params.time;
        }
        if (scope.notification.type === 'create-contractor-package') {
          text = params.fromUser() + ' has invited ' + params.toUser() + 'to send a quote for ' + params.element;
        }
        // if (scope.notification.type === 'create-material-package') {
        //   text = params.fromUser() + ' has invited ' + params.toUser() + 'to send a quote for ' + params.element;
        // }
        if (scope.notification.type == 'create-material-package') {
          text = params.fromUser() + ' has invited ' + params.toUser() + 'to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'send-quote') {
          text = params.fromUser() + ' has sent a quote ' + params.quote + ' to ' + params.toUser() + ' in ' + params.packageName;
        }
        if (scope.notification.type === 'send-addendum') {
          text = params.fromUser()  + 'has attached an addendum to ' + params.element;
        }
        if (scope.notification.type === 'edit-addendum') {
          text = params.fromUser()  + 'has edited an addendum in ' + params.element;
        }
        if (scope.notification.type === 'invite') {
          text = params.fromUser()  + 'has sent an invitation in ' + params.packageName;
        }
        if (scope.notification.type == 'invitation') {
          text = params.fromUser()  + 'has invited you to send a quote for ' + params.element;
        }
        if (scope.notification.type === 'send-message') {
          text = params.fromUser()  + 'has sent you a message in ' + params.element;
        }
        if (scope.notification.type === 'send-message-to-builder') {
          text = params.fromUser()  + 'has sent you a message in ' + params.element;
        }
        if (scope.notification.type === 'select-quote') {
          text = params.fromUser()  + 'has selected your quote for ' + params.element;
        }
        if (scope.notification.type === 'send-defect') {
          text = params.fromUser()  + 'has added a new defect to ' + params.element;
        }
        if (scope.notification.type === 'send-variation') {
          text = params.fromUser()  + 'has added a new variation to ' + params.element;
        }
        if (scope.notification.type === 'send-invoice') {
          text = params.fromUser() + 'has added a new invoice to ' + params.element;
        }
        if (scope.notification.type === 'uploadDocument') {
          text = params.fromUser()  + 'has added a new document ' + params.fileName + ' to ' + params.place;
        }
        if (scope.notification.type === 'uploadNewDocumentVersion') {
          text = params.fromUser()  + 'has updated the document ' + params.fileName + ' in project ' + params.place;
        }
        if (scope.notification.type == 'create-builder-package') {
          text = params.fromUser() + ' has invited you become the ' + params.builderOrHomeOwner + ' for project' + params.element;
        }
        if (scope.notification.type == 'send-thanks-to-loser') {
          text = params.packageName + 'has been awarded to another company. ' + params.fromUser() + ' thanks you for provide a quote';
        }
        if (scope.notification.type == 'cancel-package') {
          text = params.fromUser() + 'has canceled the package ' + params.packageName;
        }
        if (scope.notification.type == 'decline-quote') {
          text = params.fromUser() + 'has declined your quote in ' + params.packageName;
        }

        // NEW VERSION
        if (scope.notification.referenceTo == 'people-chat') {
          text = params.fromUser() + 'has send you a message in people page';
        }
        if (scope.notification.referenceTo == 'documentInpeople') {
          text = params.fromUser() + 'has upload document in people ' + params.packageName;
        }
        if (scope.notification.type == 'NewBoard') {
          text = params.fromUser() + 'has added you to new board ' + params.element;
        }
        if (scope.notification.referenceTo == 'documentInboard') {
          text = params.fromUser() + 'has upload document in board ' + params.packageName;
        }
        if (scope.notification.type == 'InvitePeopleToBoard') {
          text = params.fromUser() + 'has invited you to board ' + params.element;
        }
        if (scope.notification.referenceTo == 'board-chat') {
          text = params.fromUser() + 'has send you a message in ' + params.element;
        }
        if (scope.notification.type == 'invite-people') {
          text = params.fromUser() + 'has invited you in people page';
        }
        if (scope.notification.type == 'winner-tender') {
          text = params.fromUser() + 'has selected you for people page';
        }
        if (scope.notification.type == 'loser-tender') {
          text = params.fromUser() + ' thanks you for provide a quote' ;
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
            });
        };
      }
    };
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
              console.log(res);
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
                });
            }
          };

          notificationService.get().$promise.then(function(res){
            $rootScope.unreadMessages = res;
          });

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
              });
          };

          $scope.$watch('total',function(value) {
            if (value == 0) {
              $('.slimScrollDiv').hide();
            } else
              $('.slimScrollDiv').show();
          });

          $rootScope.$on('notification:read',function(event,notification) {
            _.remove($scope.notifications,{_id : notification._id});
            $scope.total--;
            notificationService.get().$promise.then(function(res){
              $rootScope.unreadMessages = res;
            });
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

          });
        }]

    };
  });