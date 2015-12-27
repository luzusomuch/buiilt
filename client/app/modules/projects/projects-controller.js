angular.module('buiiltApp').controller('projectsCtrl', function($scope, $timeout, $q, $state, $mdDialog, projectService) {
	
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
	
	$scope.projectsFilter = ['Project 1', 'Project 2'];
	
});