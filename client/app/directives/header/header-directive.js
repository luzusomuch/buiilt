angular.module('buiiltApp')
.directive('builtHeader', function($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    controller: function($scope, $stateParams, $rootScope,materialPackageService, authService, projectService, contractorService,teamService,filterFilter) {

      function queryProjects(){
        authService.isLoggedInAsync(function(isLoggedIn){
          if(isLoggedIn){
            $scope.isLoggedIn = true;
            $scope.project = {
              location: {},
              email: {}
            };
            $scope.user = authService.getCurrentUser();
            $scope.currentTeam = authService.getCurrentTeam();
            $scope.isLeader = $scope.user.team.role == 'admin' ? true : false;

            teamService.getHomeOwnerTeam().$promise.then(function(data){
              $scope.homeOwnerTeams = data; 
              var homeOwnerTeamMember = [];
              angular.forEach($scope.homeOwnerTeams, function(homeOwnerTeam) {
                _.each(homeOwnerTeam.leader, function(leader) {
                  homeOwnerTeamMember.push({_id: leader._id, email: leader.email});
                });
                _.each(homeOwnerTeam.member, function(member) {
                  if (member._id) {
                    homeOwnerTeamMember.push({_id: member._id._id, email: member._id.email});  
                  }
                })
              }); 
              $scope.homeOwnerTeamMember = homeOwnerTeamMember;
            });
            
            teamService.getHomeBuilderTeam().$promise.then(function(data) {
              $scope.homeBuilderTeams = data;
              var homeBuilderTeamMember = [];
              angular.forEach($scope.homeBuilderTeams, function(homeBuilderTeam) {
                _.each(homeBuilderTeam.leader, function(leader) {
                  homeBuilderTeamMember.push({_id: leader._id, email: leader.email});
                });
                _.each(homeBuilderTeam.member, function(member){
                  if (member._id) {
                    homeBuilderTeamMember.push({_id: member._id._id, email: member._id.email});
                  }
                })
              });
              $scope.homeBuilderTeamMember = homeBuilderTeamMember;
            });
            
            // console.log($scope.homeOwnerTeams.member);
            // $scope.homeOwnerTeams.member  = filterFilter($scope.homeOwnerTeams.member, {status : 'Active'});

            projectService.getProjectsByUser({'id': $scope.user._id}, function(projects) {
              $scope.projectsOwner = projects;
            });
            projectService.getProjectsByBuilder({'id': $scope.user._id}, function(projects) {
              $scope.projectsBuilder = projects;
            });
            contractorService.getProjectForContractor({'id': $scope.user._id}, function(result) {
              $scope.projectsContractor = result;
            });
            materialPackageService.getProjectForSupplier({'id': $scope.user._id}, function(result) {
              $scope.projectsSupplier = result;
            });

            if ($stateParams.id) {
              projectService.get({'id': $stateParams.id}).$promise.then(function(project) {
                var project = project;
                
                if (!project && project == null) {
                  var userId = $scope.user._id;
                  $scope.tabs = [{sref: 'team.manager', label: 'team manager'},
                            {sref: 'user.form()', label: 'edit profile'},
                            {sref: 'notification.view', label: 'notification'}];
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
          {sref: 'staff.index({id :  currentProject._id})', label: 'staff'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}],
        supplier: [{sref: 'dashboard({id :  currentProject._id})', label: 'dashboard'},
          {sref: 'materials({id :  currentProject._id})', label: 'materials'},
          {sref: 'projects.view({id :  currentProject._id})', label: 'project'}]
      };

      $scope.create = function() {
        if ($scope.project.email.title) {
          $scope.project.email = $scope.project.email.title;
          projectService.create($scope.project).$promise.then(function(data) {
            alert('Create project successfully!');
          }, function(res) {
            $scope.errors = res.data;
          });
        }
        else {
          $scope.project.email = $scope.textString;
          projectService.create($scope.project).$promise.then(function(data) {
            alert('Create project successfully!');
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