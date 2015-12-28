angular.module('buiiltApp').controller('projectsCtrl', function ($rootScope, $scope, $timeout, $q, $state, $mdDialog, projectService) {
	$rootScope.title = "Projects List";
    $scope.autoCompleteRequireMath = true;
    $scope.selectedItem = null;
    $scope.search = false;
	$scope.projectsFilter = [];

    $scope.createProject = function(form) {
        $scope.submitted = true;
            if (form.$valid) {
                projectService.createProjectNewVersion($scope.project).$promise.then(function(data){
                    $scope.projects.push(data);
                    $state.go('project.overview', {id: data._id},{reload: true});
                    $scope.submitted = false;
                }, function(res) {
                $scope.errors = res.data.msg;
            });
        }
    };
    
    $scope.saveProject = function (){
        console.log('project has been saved.');
        $mdDialog.hide();
    };
    
    //Functions to Handle the Create Project Dialog.
    $scope.showCreateProjectModal = function($event) {
    
        $mdDialog.show({
          targetEvent: $event,
          controller: 'projectsCtrl',
          templateUrl: 'app/modules/projects/partials/projects-create.html',
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