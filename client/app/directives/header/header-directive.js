angular.module('buiiltApp')
.directive('buiiltHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/header/header.html',
        controller: function($scope,$state, $stateParams, $rootScope, authService,teamService, socket, $mdDialog, $mdMedia) {
            $rootScope.projects = [];
            $scope.submitted = false;
    	    $scope.$state = $state;
            $scope.settingsState = ["settings.user", "settings.company", "settings.staff", "settings.billing", "settings.tags", "settings.schedule"];
            var originatorEv;
          
            $scope.goto = function(newstate) {
    		    $state.go(newstate, {}, {reload: true});
            };
			
			$scope.inlineHelp = function() {
				inline_manual_player.showPanel();
			};

            function queryProjects(callback){
                var cb = callback || angular.noop;
                authService.isLoggedInAsync(function(isLoggedIn){
                    if(isLoggedIn){
                        $scope.isLoggedIn = true;
                        $scope.duration = 10000;
                        authService.getCurrentUser().$promise
                        .then(function(res) {
                            checkFavouriteProjects(res.projects, res.favouriteProjects);
                            $rootScope.currentUser = $scope.currentUser = res;
                            Tawk_API.visitor = {
                                name : $rootScope.currentUser.name,
                                email : $rootScope.currentUser.email
                            };
                            socket.emit("join", res._id);
                            if ($state.current.name == 'dashboard' && ! res.emailVerified) {
                                Materialize.toast('<span>You must confirm your email to hide this message!</span><a class="btn-flat yellow-text" id="sendVerification">Send Verification Email Again<a>', $scope.duration,'rounded');
                            }
                            if (typeof $rootScope.isLeader == 'undefined' || !$rootScope.isLeader) {
                                $rootScope.currentUser.isLeader = ($scope.currentUser.team.role == 'admin');
                            }
                            $scope.isLeader = $rootScope.isLeader;
                            authService.getCurrentTeam().$promise
                            .then(function(res) {
                                $scope.currentTeam = res;
                                $rootScope.projects = $scope.currentUser.projects;
                                if (!$scope.currentTeam._id) {
                                    $state.go('settings.staff', {},{reload: true}).then(function(){});
                                }
                                return cb();
                            });
                        });
                    } else {
                        $scope.isLoggedIn = false;
                        return cb();
                    }
                });
            };

            //first load
            queryProjects();

            //check menu when state changes
            // $rootScope.$on('$stateChangeSuccess', function (event, next) {
            //     queryProjects(function() {
            //         $rootScope.currentUser = $scope.currentUser;
            //         $rootScope.currentTeam = $scope.currentTeam;

            //     });
            // });

            $rootScope.$on('TeamUpdate',function(event,team) {
                queryProjects();
            });   

            $rootScope.$on('Profile.change',function(event,data) {
                $scope.currentUser.name = data.name;
            });

            $rootScope.$on("Project.Archive", function(event, project) {
                var index = _.findIndex($rootScope.projects, function(item) {
                    return item._id == project._id;
                });
                $rootScope.projects[index].status = "archive";
            });

            /*Receive when user choosen project as favourite or unfavourite*/
            $scope.$on("Project.Favourite", function(ev, data) {
                var index = $rootScope.currentUser.favouriteProjects.indexOf(data._id);
                if (index !== -1) 
                    $rootScope.currentUser.favouriteProjects.splice(index, 1);
                else
                    $rootScope.currentUser.favouriteProjects.push(data._id);
                checkFavouriteProjects($rootScope.currentUser.projects, $rootScope.currentUser.favouriteProjects);
            });

            document.addEventListener('click',function(e) {
                if (e.target.id == 'sendVerification') {
                    authService.sendVerification().$promise
                    .then(function(res) {
                        var toast = document.getElementsByClassName('toast');
                        toast[0].style.display = 'none';
                        Materialize.toast('<span>Verification email has been sent to your email address</span>', $scope.duration,'rounded');
                    });
                }
            });

            $rootScope.sendVerification = function() {
                $scope.duration = 0;
            };
			
			$scope.helpChatSupport = function(){
				Tawk_API.toggle();
			};

            $scope.showModal = function(event, name) {
                $mdDialog.show({
                    targetEvent: event,
                    controller: 'projectsCtrl',
                    resolve: {
                        teamInvitations: ["authService", function(authService){
                            return authService.getCurrentInvitation().$promise;
                        }],
                        projectsInvitation: ["inviteTokenService", function(inviteTokenService) {
                            return inviteTokenService.getProjectsInvitation().$promise;
                        }]
                    },
                    templateUrl: (name === "projects-create.html" ? 'app/modules/projects/projects-create/projects-create.html' : ""),
                    parent: angular.element(document.body),
                    clickOutsideToClose:false
                });
            };

            /*Mark project as favourite if existed in favourite list*/
            function checkFavouriteProjects(projects, favouriteProjects) {
                angular.forEach(projects, function(p) {
                    p.isFavourite = false;
                    var index = favouriteProjects.indexOf(p._id);
                    if (index !== -1) {
                        p.isFavourite = true
                    }
                });
            };
        }
    };
});
