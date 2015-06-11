angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, $stateParams, $rootScope, authService, projectService) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.projectParamId = $stateParams.id;
            $scope.isLoggedIn = true;
            $scope.user = authService.getCurrentUser();
            $scope.currentTeam = {};
            $scope.currentProject = {};
            $rootScope.$on('$stateChangeSuccess', function () {
              $scope.currentTeam = $rootScope.currentTeam;
              $scope.currentProject = $rootScope.currentProject;
            });

            projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
              $scope.projectsOwner = projects;
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projectsBuilder = projects;
            });

            if (!$scope.projectParamId) {
              var userId = $scope.user._id;
              $scope.tabs = [{sref: 'team.manager', label: 'team manager'},
                            {sref: 'user.form({id: userId})', label: 'edit profile'},
                            {sref: 'notification.view({id: userId})', label: 'notification'}];
            }
            else if($scope.projectParamId) {
              projectService.get({id: $scope.projectParamId}).$promise.then(function(project) {
                if (project) {
                  console.log('has project');
                  $scope.project = project;
                  $scope.tabs = $scope.menuTypes['homeOwner'];
                }
                else {
                  console.log('no project');
                  $scope.tabs = [{sref: 'team.manager', label: 'team manager'},
                            {sref: 'user.form({id: userId})', label: 'edit profile'},
                            {sref: 'notification.view({id: userId})', label: 'notification'}];
                }
              });
            }
            
            // contractorService.getProjectForContractorWhoWinner({'id': $scope.user._id}, function(result) {
            //   $scope.projectsContractor = result;
            //   angular.forEach(result, function(subResult) {
            //     if ($scope.user._id === subResult.winner._id) {
            //       $scope.tabs = $scope.menuTypes['contractor'];
            //     }
            //   });
            // });


            // teamService.getTeamByUser({'id': $scope.user._id}, function(team) {
            //   if (team.type === 'homeOwner') {
            //     $scope.tabs = $scope.menuTypes['homeOwner']  
            //   }
            //   else if(team.type === 'buider') {
            //     $scope.tabs = $scope.menuTypes['buider']   
            //   }
            //   else if(team.type === 'contractor') {
            //     $scope.tabs = $scope.menuTypes['contractor']
            //   }
            //   else if(team.type === 'supplier') {
            //     $scope.tabs = $scope.menuTypes['supplier']
            //   }
            //   // projectService.getProjectsByUser({'id': $scope.user._id}, function(projects){
            //   //   $scope.projectsHomeOwner = projects;
            //   // });
            // });
            
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
        // $scope.currentProject = $rootScope.currentProject;
        // $scope.currentTeam = $rootScope.currentTeam;
      });


      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'client', label: 'builder'},
          {sref: 'projects.view', label: 'project'}],
        contractor: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'projects.view', label: 'project'}],
        buider: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'client', label: 'client'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'materials', label: 'materials'},
          {sref: 'staff', label: 'staff'},
          {sref: 'projects.view', label: 'project'}],
        supplier: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'projects.view', label: 'project'}]
      };

      // $scope.user = authService.getCurrentUser();

      // $scope.loadMenu = function () {
      //   if ($scope.user._id) {
      //     $scope.tabs=$scope.menuTypes[$scope.user.type];
      //   }
      // };
      // $scope.loadMenu();
    }
  };
});