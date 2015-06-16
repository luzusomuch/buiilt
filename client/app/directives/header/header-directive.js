angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, $stateParams, $rootScope, authService, projectService, contractorService) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.project = {
              location: {}
            };
            $scope.user = authService.getCurrentUser();
            $scope.currentTeam = authService.getCurrentTeam();
            $scope.isLeader = $scope.user.team.role == 'admin' ? true : false;

            projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
              $scope.projectsOwner = projects;
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projectsBuilder = projects;
            });
            contractorService.getProjectForContractorWhoWinner({'id': $scope.user._id}, function(result) {
              $scope.projectsContractor = result;
            });

            if ($stateParams.id) {
              projectService.get({'id': $stateParams.id}).$promise.then(function(project) {
                var project = project;
                
                if (!project && project == null) {
                  var userId = $scope.user._id;
                  $scope.tabs = [{sref: 'team.manager', label: 'team manager'},
                            {sref: 'user.form({id: userId})', label: 'edit profile'},
                            {sref: 'notification.view({id: userId})', label: 'notification'}];
                }
                else {
                  if ($scope.currentTeam.type === 'homeOwner') {
                    $scope.tabs = $scope.menuTypes['homeOwner'];  
                  }
                  else if($scope.currentTeam.type === 'buider') {
                    $scope.tabs = $scope.menuTypes['buider'];
                  }
                  else if($scope.currentTeam.type === 'contractor') {
                    $scope.tabs = $scope.menuTypes['contractor']; 
                  }
                  else if($scope.currentTeam.type === 'supplier') {
                    $scope.tabs = $scope.menuTypes['supplier']; 
                  }
                }
              });
            }
            else {
              var userId = $scope.user._id;
              $scope.tabs = [{sref: 'team.manager', label: 'team manager'},
                        {sref: 'user.form({id: userId})', label: 'edit profile'},
                        {sref: 'notification.view({id: userId})', label: 'notification'}];
            }
            


          } else {
            $scope.isLoggedIn = false;
          }
        });
      };

      //first load
      queryProjects();

      //check menu when state changes
      $rootScope.$on('$stateChangeSuccess', function (event, next) {
        queryProjects();
        $scope.currentProject = $rootScope.currentProject;
      });


      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client({id :  currentProject._id})', label: 'builder'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        contractor: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contractors'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        buider: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'client({id :  currentProject._id})', label: 'client'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contractors'},
          {sref: 'materials({id :  currentProject._id})', label: 'materials'},
          {sref: 'staff({id :  currentProject._id})', label: 'staff'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        supplier: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'contractors({id :  currentProject._id})', label: 'contractors'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}]
      };

      // $scope.user = authService.getCurrentUser();

      // $scope.loadMenu = function () {
      //   if ($scope.user._id) {
      //     $scope.tabs=$scope.menuTypes[$scope.user.type];
      //   }
      // };
      // $scope.loadMenu();
      $scope.create = function() {
        projectService.create($scope.project).$promise.then(function(data) {
          //show alert
          // $scope.success = true;
          alert('Create project successfully!');

        }, function(res) {
          $scope.errors = res.data;
        });
      };
    }
  };
});