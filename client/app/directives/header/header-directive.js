angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope,$state, $stateParams, $rootScope,materialPackageService, authService, projectService, contractorService,teamService,filterFilter) {
      $scope.projects = [];
      $scope.submitted = false;
	  
	  //inline manual functions
	  $rootScope.startSignupWizard = function() {
	  	inline_manual_player.activateTopic('4881', '1');
	  }
	  $rootScope.startNewProjectWizard = function() {
	  	inline_manual_player.activateTopic('4877', '1');
	  }
	  $rootScope.startNewSubcontractorWizard = function() {
	  	inline_manual_player.activateTopic('4878', '1');
	  }
	  $rootScope.startNewMaterialWizard = function() {
	  	inline_manual_player.activateTopic('4887', '1');
	  }
	  $rootScope.startWorkOrderWizard = function() {
	  	inline_manual_player.activateTopic('4892', '1');
	  }
	  $rootScope.startUploadDocWizard = function() {
	  	inline_manual_player.activateTopic('4893', '1');
	  }
	  $rootScope.startAddTeamMemberWizard = function() {
	  	inline_manual_player.activateTopic('4872', '1');
	  }

      //get header height
      $rootScope.headerHeight = $('nav').outerHeight() + 48;

      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client.list({id :  currentProject._id})', label: 'builder'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'documentation'}],
        contractor: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contracts'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'documentation'}],
        builder: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client.list({id :  currentProject._id})', label: 'client'},
          {sref: 'contractors({id :  currentProject._id})', label: 'subcontractors'},
          {sref: 'materials({id :  currentProject._id})', label: 'suppliers'},
          {sref: 'staff.index({id :  currentProject._id})', label: 'employees'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'documentation'}],
        supplier: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'materials({id :  currentProject._id})', label: 'materials'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'documentation'}],
        other : [{sref: 'team.manager', label: 'team manager'},
          {sref: 'user', label: 'User profile'}]
      };

      function queryProjects(callback){
        var cb = callback || angular.noop;
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.project = {
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
                if (typeof $rootScope.isLeader == 'undefined') {
                  $rootScope.isLeader = ($scope.user.team.role == 'admin');
                }
                $scope.isLeader = $rootScope.isLeader;
                authService.getCurrentTeam().$promise
                  .then(function(res) {
                    $scope.currentTeam = res;
                    $scope.projects = $scope.currentTeam.project;
                    if ($stateParams.id) {
                      if ($scope.currentTeam.type === 'homeOwner') {
                        $scope.tabs = $scope.menuTypes['homeOwner'];
                      }
                      else if ($scope.currentTeam.type === 'builder') {
                        $scope.tabs = $scope.menuTypes['builder'];
                      }
                      else if ($scope.currentTeam.type === 'contractor') {
                        $scope.tabs = $scope.menuTypes['contractor'];
                      }
                      else if ($scope.currentTeam.type === 'supplier') {
                        $scope.tabs = $scope.menuTypes['supplier'];
                      }
                    } else {
                      $scope.tabs = $scope.menuTypes['other'];
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
            })
        }
      });




      $rootScope.sendVerification = function() {
        $scope.duration = 0;
        console.log($scope.duration);
        //authService.sendVerification().$promise
        //  .then(function(res) {
        //
        //  })
      };

      $scope.create = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            projectService.create($scope.project).$promise.then(function(data) {
              $scope.projects.push(data);
              $state.go('dashboard',{id : data._id},{reload : true});
              $scope.project = {
                package : {
                  location: {},
                  to : ''
                }
              };
              $scope.submitted = false;
              $('#createProject').closeModal();
            }, function(res) {
              $scope.errors = res.data;
            });
        }
      };

      $scope.inputChanged = function(str) {
        $scope.textString = str;
      };
    }
  };
});