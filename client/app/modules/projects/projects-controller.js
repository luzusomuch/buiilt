angular.module('buiiltApp').controller('projectsCtrl', function ($rootScope, $scope, $timeout, $state, $mdDialog, projectService, inviteTokenService) {
	$rootScope.title = "Projects List";
    $scope.autoCompleteRequireMath = true;
    $scope.selectedItem = null;
    $scope.search = false;
	$scope.projectsFilter = [];
    $scope.projects = $rootScope.projects;
    $scope.allowCreateProject = false;
    $scope.currentTeam = $rootScope.currentTeam;
    if ($scope.currentTeam._id && ($scope.currentTeam.type !== "consultant" || $scope.currentTeam.type !== "contractor")) {
        $scope.allowCreateProject = true;
    }

    inviteTokenService.getProjectsInvitation().$promise.then(function(res) {
        $scope.projectsInvitation = res;
    });

    $scope.createProject = function(form) {
        $scope.submitted = true;
            if (form.$valid) {
                $scope.project.teamType = $scope.currentTeam.type;
                projectService.create($scope.project).$promise.then(function(data){
                    $scope.projects.push(data);
                    $scope.saveProject();
                    $state.go('project.overview', {id: data._id},{reload: true});
                    $scope.submitted = false;
                }, function(res) {
                $scope.errors = res.data.msg;
            });
        }
    };
    
    $scope.saveProject = function (){
        $mdDialog.hide();
    };
    
    //Functions to Handle the Create Project Dialog.
    $scope.showCreateProjectModal = function($event) {
    
        $mdDialog.show({
          targetEvent: $event,
          controller: 'projectsCtrl',
          templateUrl: 'app/modules/projects/projects-create/projects-create.html',
          parent: angular.element(document.body),
          clickOutsideToClose:false
        });
        
    };
    
    $scope.hideCreateProjectModal = function () {
        $mdDialog.cancel();
    };
    

    $scope.querySearch = function(value) {
        var results = value ? $scope.projects.filter(createFilter(value)) : [];
        results = _.uniq(results, '_id');
        return results;
    };

    function createFilter(query) {
        return function filterFn(project) {
            return project.name.toLowerCase().indexOf(query) > -1;
        };
    };

    $scope.addChip = function() {
        $scope.search = true;
    };

    $scope.removeChip = function() {
        if ($scope.projectsFilter.length === 0) {
            $scope.search = false;
        }
    };
});