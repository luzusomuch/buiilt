angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, $stateParams, $rootScope, authService, projectService) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.user = authService.getCurrentUser();
            $scope.currentTeam = authService.getCurrentTeam();
            $scope.isLeader = $scope.user.team.role == 'admin' ? true : false;

            projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
              $scope.projectsOwner = projects;
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projectsBuilder = projects;
            });

            if ($stateParams.id) {
              projectService.get({'id': $stateParams.id}).$promise.then(function(project) {
                $scope.project = project; 
                if (!project) {
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
                    $scope.tabs = $scope.menuTypes['homeOwner'];
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
            // contractorService.getProjectForContractorWhoWinner({'id': $scope.user._id}, function(result) {
            //   $scope.projectsContractor = result;
            //   angular.forEach(result, function(subResult) {
            //     if ($scope.user._id === subResult.winner._id) {
            //       $scope.tabs = $scope.menuTypes['contractor'];
            //     }
            //   });
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
        $scope.currentProject = $rootScope.currentProject;
      });


      $scope.menuTypes = {
        homeOwner: [{sref: 'dashboard({id :  project._id})', label: 'dashboard'},
          {sref: 'client({id :  project._id})', label: 'builder'},
          {sref: 'projects.view({id :  project._id})', label: 'project'}],
        contractor: [{sref: 'dashboard({id :  project._id})', label: 'dashboard'},
          {sref: 'contractors({id :  project._id})', label: 'contractors'},
          {sref: 'projects.view({id :  project._id})', label: 'project'}],
        buider: [{sref: 'dashboard({id :  project._id})', label: 'dashboard'},
          {sref: 'client({id :  project._id})', label: 'client'},
          {sref: 'contractors({id :  project._id})', label: 'contractors'},
          {sref: 'materials({id :  project._id})', label: 'materials'},
          {sref: 'staff({id :  project._id})', label: 'staff'},
          {sref: 'projects.view({id :  project._id})', label: 'project'}],
        supplier: [{sref: 'dashboard({id :  project._id})', label: 'dashboard'},
          {sref: 'contractors({id :  project._id})', label: 'contractors'},
          {sref: 'projects.view({id :  project._id})', label: 'project'}]
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