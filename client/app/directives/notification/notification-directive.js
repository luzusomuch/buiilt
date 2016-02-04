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
                time: '<span>{{notification.createdAt | date: "hh:mm dd-MM-yyyy"}}</span>'
            };

            var threadArray = ['thread-assign','thread-message'];
            var teamArray = ['team-invite','team-accept','team-remove','team-leave','team-assign-leader'];
            var fileArray = ["file-assign",'file-upload-reversion'];
            var documentArray = ["document-assign",'document-upload-reversion'];
            var taskArray = ["task-assign", "task-reopened", "task-completed", "task-revoke"];

            var getSref = function(notification) {
                if (notification.type === "invite-to-project") {
                    return 'project.overview({id: notification.element.project})';
                }

                if (teamArray.indexOf(notification.type) !== -1)  {
                    return 'setting.staff';
                }
            };

            var text;
            if (scope.notification.type === "invite-to-project") {
                text = params.fromUser() + " has invited you to join their project, " + params.time;
            }
            if (scope.notification.type === 'team-invite') {
                text = params.fromUser() + ' has invited you to join ' + params.team() + ' at ' + params.time;
            }
            if (scope.notification.type === 'team-accept') {
                text = params.fromUser() + ' has accepted to join ' + params.team() + ' at ' + params.time;
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
            scope.notification.sref = getSref(scope.notification);

            // element.html('<a ui-sref="{{notification.sref}}" ui-sref-opts="{reload: true}" ng-click="click(notification)" style="padding: 0px"><div class="_notification"><p>' + text + '</p></div></a>').show();
            element.html('<md-button ui-sref="{{notification.sref}}" ui-sref-opts="{reload: true}" ng-click="click(notification)">' + text + '</md-button>').show();
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
            var limit = 20;

            notificationService.getTotal().$promise
            .then(function(res) {
                $scope.total = res.count;
            });

            $scope.openNotification = function($mdOpenMenu, $event) {
                $mdOpenMenu($event);
            };

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