angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope,$state, $stateParams, $rootScope,materialPackageService, authService, projectService, contractorService,teamService,filterFilter) {
      $scope.projects = [];
      $scope.submitted = false;
      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.project = {
              package : {
                location: {},
                to : ''
              }
            };
            authService.getCurrentUser().$promise
              .then(function(res) {
                $scope.user = res;
                $scope.isLeader = $scope.user.team.role == 'admin';
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
                  });
              });

          } else {
            $scope.isLoggedIn = false;
          }
        });
      };
      $rootScope.states = {};


      //first load
      queryProjects();
      //check menu when state changes
      $rootScope.$on('$stateChangeSuccess', function (event, next) {
        queryProjects();
        $scope.currentProject = $rootScope.currentProject;
        if ($scope.currentProject && !_.find($scope.currentTeam.project,{_id : $scope.currentProject._id}))
        {
          $state.go('team.manager');
        }
        if ($state.current.name == 'team.manager' || $state.current.name == 'dashboard'){
          setTimeout(function () {
            $('#tabsMenu').tabs();
          }, 500);
        }
      });

      $rootScope.$on('TeamUpdate',function(event,data) {
        queryProjects();
      });


      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client({id :  currentProject._id})', label: 'builder'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        contractor: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contractors'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        builder: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client({id :  currentProject._id})', label: 'client'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contractors'},
          {sref: 'materials({id :  currentProject._id})', label: 'materials'},
          {sref: 'staff.index({id :  currentProject._id})', label: 'staff'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        supplier: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'materials({id :  currentProject._id})', label: 'materials'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        other : [{sref: 'team.manager', label: 'team manager'},
          {sref: 'user.form', label: 'edit profile'},
          {sref: 'notification.view', label: 'notification'}]
      };

      $scope.create = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            projectService.create($scope.project).$promise.then(function(data) {
              $scope.projects.push(data);
              $state.go('dashboard',{id : data._id});
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