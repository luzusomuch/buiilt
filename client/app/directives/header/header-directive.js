angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, authService, projectService, contractorService) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.user = authService.getCurrentUser();

            projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
              $scope.projectsOwner = projects;
              angular.forEach(projects, function(project) {
                if ($scope.user._id === project.user) {
                  $scope.tabs = $scope.menuTypes['homeOwner'];
                }
              });
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projectsBuilder = projects;
              angular.forEach(projects, function(project) {
                if ($scope.user._id === project.builder) {
                  $scope.tabs = $scope.menuTypes['buider'];
                }
              });
            });
            contractorService.getProjectForContractorWhoWinner({'id': $scope.user._id}, function(result) {
              $scope.projectsContractor = result;
              angular.forEach(result, function(subResult) {
                if ($scope.user._id === subResult.winner._id) {
                  $scope.tabs = $scope.menuTypes['contractor'];
                }
              });
            });
          }else{
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