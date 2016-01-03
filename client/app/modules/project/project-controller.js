angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, project, $mdToast) {
    
	$rootScope.project = $scope.project = project;
    $rootScope.title = $scope.project.name + " Overview";
    $scope.errors = {};
    $scope.success = {};

    $scope.editProject = function(form) {
        if (form.$valid) {
            projectService.updateProject({id: $scope.project._id}, $scope.project).$promise.then(function(res) {
                $rootScope.project = $scope.project = res;
                $scope.showToast("Your changes have been saved!")
            }, function(err) {
                console.log(err);
                $scope.showToast("There was an Error...");
            });
        }
    };
	
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('top','right').hideDelay(3000));
    };
	
	$scope.showEditProjectModal = function($event){
		
		$mdDialog.show({
		  targetEvent: $event,
	      controller: 'projectCtrl',
	      templateUrl: 'app/modules/project/project-overview/partials/project-overview-edit.html',
	      parent: angular.element(document.body),
	      clickOutsideToClose: false
	    });
		
	};
	
	$scope.closeDialog = function(){
		$mdDialog.cancel();
	};

});