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
            console.log(scope.notification);
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
                time: '<span>{{notification.createdAt | date: "hh:mm dd-MM-yyyy"}}</span>'
            };

            var threadArray = ['thread-assign','thread-message'];
            var teamArray = ['team-invite','team-accept','team-remove','team-leave','team-assign-leader'];
            var fileArray = ["file-assign",'file-upload-reversion'];
            var documentArray = ["document-assign",'document-upload-reversion'];
            var taskArray = ["task-assign", "task-reopened", "task-completed", "task-revoke"];

            var getSref = function(notification) {
                if (taskArray.indexOf(notification.type) !== -1) {
                    return 'project.tasks.detail({id: notification.element.project, taskId: notification.element._id})';
                }

                if (teamArray.indexOf(notification.type) !== -1)  {
                    return 'setting.staff';
                }

                if (threadArray.indexOf(notification.type) !== -1) {
                    return 'project.messages.detail({id: notification.element.project, messageId: notification.element._id})';
                }

                if (fileArray.indexOf(notification.type) !== -1) {
                    return 'project.files.detail({id: notification.element.project, fileId: notification.element._id})';
                }
                if (documentArray.indexOf(notification.type) !== -1) {
                    return 'project.documents.detail({id: notification.element.project, documentId: notification.element._id})';
                }
                if (notification.referenceTo === "tender") {
                    return 'project.tenders.detail({id: notification.element.project, tenderId: notification.element.data._id})'
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
            if (scope.notification.type === 'team-assign-leader') {
                text = params.fromUser() + ' has assigned ' + params.toUser() + ' as an administrator in '+ params.team() + ' at ' + params.time;
            }
            if (scope.notification.type === "document-upload-reversion") {
                text = params.fromUser() + ' has upload new document reversion ' + params.element + ' at ' + params.time;   
            }
            if (scope.notification.type === "document-assign") {
                text = params.fromUser() + ' has upload new document ' + params.element + ' at ' + params.time;      
            }
            if (scope.notification.type === "send-broadcast-message") {
                var latestActivity = _.last(scope.notification.element.data.inviterActivities);
                var message;
                if (latestActivity.type === "broadcast-message") {
                    message = latestActivity.element.message;
                } 
                text = params.fromUser() + ' has sent you new message ' + message + ' at ' + params.time;         
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
        controller: ['$scope', '$rootScope','notificationService','socket','authService', function ($scope, $rootScope, notificationService,socket,authService ) {
            $scope.slimScrollOptions = {height: '390px'};
            $scope.readMore = true;
            $scope.currentUser = $rootScope.currentUser;
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
                        var notificationsWithoutMention = [];
                        _.each(res, function(item) {
                            if (item) {
                                if (item.referenceTo == "people-chat-without-mention") {
                                    notificationsWithoutMention.push(item);
                                } else if (item.referenceTo == "board-chat-without-mention") {
                                    notificationsWithoutMention.push(item);
                                }
                            }
                        });
                    _.each(notificationsWithoutMention, function(item) {
                            _.remove($scope.notifications, {_id: item._id});
                        });
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