angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, authService, projectService) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.user = authService.getCurrentUser();

            projectService.getProjectsByUser({id: $scope.user._id}, function(projects) {
              $scope.projects = projects;
              angular.forEach(projects, function(project) {
                if ($scope.user._id === project.user) {
                  $scope.tabs = $scope.menuTypes['homeOwner'];
                }
              });
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projects = projects;
              angular.forEach(projects, function(project) {
                if ($scope.user._id === project.builder) {
                  $scope.tabs = $scope.menuTypes['buider'];
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
        console.log($scope.currentProject);
        console.log($scope.menuTypes);
      });


      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'client', label: 'builder'},
          {sref: 'project', label: 'project'}],
        contractor: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'project', label: 'project'}],
        buider: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'client', label: 'client'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'materials', label: 'materials'},
          {sref: 'staff', label: 'staff'},
          {sref: 'project', label: 'project'}],
        supplier: [{sref: 'dashboard', label: 'dashboard'},
          {sref: 'contractors', label: 'contractors'},
          {sref: 'project', label: 'project'}]
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