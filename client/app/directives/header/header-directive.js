angular.module('buiiltApp')
.directive('buiiltHeader', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: 'app/directives/header/header.html',
        controller: function($scope,$state, $stateParams, $rootScope, authService,teamService, socket, $mdDialog, $mdMedia) {
            $rootScope.projects = [];
            $scope.submitted = false;
    	  
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

            $scope.showHelpDialog = function(event) {
                $mdDialog.show({
                    targetEvent: event,
					controller: function helpBarController($scope, $mdDialog) {
						
						$scope.closeDialog = function() {
				            $mdDialog.hide();
				        };
						
						$scope.inlinePlay = function(topicID) {
							$mdDialog.hide();
							inline_manual_player.activateTopic(topicID);
						};
			        },
                    templateUrl: 'app/directives/header/helpModal.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            }
        }
    };
});
