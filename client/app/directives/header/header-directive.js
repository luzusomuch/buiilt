angular.module('buiiltApp')
.directive('buiiltHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope,$state, $stateParams, $rootScope,materialPackageService, authService, projectService, contractorService,teamService,filterFilter, builderPackageService, socket, $mdDialog, $mdMedia) {
      $scope.projects = [];
      $scope.submitted = false;
	  
	  
	  var originatorEv;
	  
      $scope.goto = function(newstate) {
		  $state.go(newstate, {}, {reload: true});
      };
	   
      $scope.createProject = function(form) {
         $scope.submitted = true;
         if (form.$valid) {
		
           projectService.createProjectNewVersion($scope.project).$promise.then(function(data){
             console.log(data);
             $scope.projects.push(data);
             $state.go('dashboard', {id: data._id},{reload: true});
             $scope.submitted = false;
             $("#createProject").closeModal();
           }, function(res) {
             $scope.errors = res.data.msg;
           });
         }
       };

      function queryProjects(callback){
        var cb = callback || angular.noop;
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.project = {
              hasArchitect: false,
              selectedOwnerUserType: '',
              homeOwnerHireArchitect: 'true',
              homeOwnerAssignBuilder: 'true',
              architectManagerHisProject: 'true',
              haveContracted: 'true',
              builderHireArchitect: 'true',
              builderAssignHomeOwner: 'true',
              package : {
                location: {},
                to : ''
              }
            };
            $scope.duration = 10000;
            authService.getCurrentUser().$promise
              .then(function(res) {
                $rootScope.user = $scope.user = res;
                if ($state.current.name == 'dashboard' && ! res.emailVerified) {
                  Materialize.toast('<span>You must confirm your email to hide this message!</span><a class="btn-flat yellow-text" id="sendVerification">Send Verification Email Again<a>', $scope.duration,'rounded');
                }
                if (typeof $rootScope.isLeader == 'undefined' || !$rootScope.isLeader) {
                  $rootScope.isLeader = ($scope.user.team.role == 'admin');
                }
                $scope.isLeader = $rootScope.isLeader;
                authService.getCurrentTeam().$promise
                  .then(function(res) {
                    $scope.currentTeam = res;
					
                    $scope.projects = $scope.user.projects;
                    if ($stateParams.id) {
                      builderPackageService.findDefaultByProject({id: $stateParams.id}).$promise.then(function(res){
						  
                        $scope.tabs = $scope.menuTypesNewVersion['hasProject'];
                      });

                    } else {
					
                      //$scope.tabs = $scope.menuTypesNewVersion['other'];
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
      $rootScope.$on('$stateChangeSuccess', function (event, next) {
        queryProjects(function() {
          $scope.currentProject = $rootScope.currentProject;
          $rootScope.currentUser = $scope.user;
          $rootScope.currentTeam = $scope.currentTeam;
          if ($scope.user && $scope.currentProject && $scope.currentTeam && !_.find($scope.currentTeam.project,{_id : $scope.currentProject._id}))
          {
            // $state.go('team.manager');
          }

          if ($state.current.name == 'team.manager' || $state.current.name == 'dashboard'){
            setTimeout(function () {
              $('#tabsMenu').tabs();
            }, 500);
          }
        });
      });

      $rootScope.$on('TeamUpdate',function(event,team) {
        queryProjects();

      });

      $rootScope.$on('Profile.change',function(event,data) {
        $scope.user.name = data.name;
      });

      document.addEventListener('click',function(e) {
        if (e.target.id == 'sendVerification')
        {
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

      $scope.selectedOwnerUserType = function(type) {
        $scope.project.selectedOwnerUserType = type;
      };

      $scope.inputChanged = function(str) {
        $scope.textString = str;
      };
    }
  };
});
