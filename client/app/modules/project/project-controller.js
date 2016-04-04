angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, $mdToast, filepickerService, uploadService, peopleService, people) {
	$scope.project = $rootScope.project;
    $rootScope.title = $scope.project.name + " Overview";
    $scope.people = people;

    $scope.errors = {};
    $scope.success = {};

    $scope.editProject = function(form) {
        if (form.$valid) {
            projectService.updateProject({id: $scope.project._id}, $scope.project).$promise.then(function(res) {
                $rootScope.project = $scope.project = res;
                $scope.showToast("Your Edits Have Been Saved.");
				$mdDialog.hide();
				
				//Project Details Updated
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Project Details Updated");
				
            }, function(err) {
                console.log(err);
                $scope.showToast("There Has Been An Error...");
            });
        }
    };
	
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
	
	$scope.showEditProjectModal = function($event){
		$mdDialog.show({
		    targetEvent: $event,
	        controller: 'projectCtrl',
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
            },
	        templateUrl: 'app/modules/project/project-overview/partials/project-overview-edit.html',
	        parent: angular.element(document.body),
	        clickOutsideToClose: false
	    });
	};
	
	$scope.closeDialog = function(){
		$mdDialog.cancel();
	};

    $scope.archiveProject = function() {
        var confirm = $mdDialog.confirm().title("Do you want to archive this project?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.project.archive = true;
            projectService.updateProject({id: $stateParams.id}, $scope.project).$promise.then(function(res) {
                $scope.showToast("Your Project Has Been Archived Successfully.");
                $scope.closeDialog();
                $state.go("projects.archived");
                $rootScope.$broadcast("Project.Archive", res);
            }, function(err) {
                $scope.showToast("There Has Been An Error...");
            });
        }, function() {
            
        });
    };

    $scope.downloadBackUp = function() {
        projectService.downloadBackUp({id: $stateParams.id}).$promise.then(function(res) {
            $scope.showToast("Please Check Your Inbox For The Backup File...");
        }, function(err) {$scope.showToast(err.message);});
    };

});