angular.module('buiiltApp')
  .directive('builtHeader', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/directives/header/header.html',
      controller: function ($scope, authService, projectService, $rootScope, $cookieStore, packageService) {
        $scope.isLoggedIn=authService.isLoggedIn;
        $scope.user = authService.getCurrentUser();

        $scope.menuTypes = {
          homeOwner: [{sref:'dashboard',label:'dashboard'},
            {sref:'client',label:'builder'},
            {sref:'project',label:'project'}],
          contractor: [{sref:'dashboard',label:'dashboard'},
            {sref:'contractors',label:'contractors'},
            {sref:'project',label:'project'}],
          buider: [{sref:'dashboard',label:'dashboard'},
            {sref:'client',label:'client'},
            {sref:'contractors',label:'contractors'},
            {sref:'materials',label:'materials'},
            {sref:'staff',label:'staff'},
            {sref:'project',label:'project'}],
          supplier: [{sref:'dashboard',label:'dashboard'},
            {sref:'contractors',label:'contractors'},
            {sref:'project',label:'project'}]
        };
        
        projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
          $scope.projects = projects;
          angular.forEach(projects, function(project) {
            if ($scope.user._id == project.user) {
              $scope.tabs = $scope.menuTypes['homeOwner'];
            }
          });
        });
        projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects){
          $scope.projects = projects;
          angular.forEach(projects, function(project) {
            if ($scope.user._id == project.builder) {
              $scope.tabs = $scope.menuTypes['buider'];
            }
          });
        });

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