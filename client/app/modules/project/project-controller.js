angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, $mdToast, filepickerService, uploadService, peopleService) {
    projectService.get({id: $stateParams.id}).$promise.then(function(res) {
    	$rootScope.project = $scope.project = res;
        $rootScope.title = $scope.project.name + " Overview";
    });

    var userType;
    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res) {
        _.each($rootScope.roles, function(role) {
            _.each(res[role], function(tender) {
                if (_.findIndex(tender.tenderers, function(tenderer) {
                    if (tenderer._id) {
                        return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                    }
                }) !== -1) {
                    $scope.showSubmitTender = true;
                    userType = role;
                }
            });
        });
    });

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

    $scope.showFileUpload = function($event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectCtrl',
            templateUrl: 'app/modules/project/project-overview/partials/upload-modal.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.uploadFile = {};
    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        file.userType = userType;
        $scope.uploadFile = file;
    };

    $scope.archiveProject = function() {
        var confirm = $mdDialog.confirm().title("Do you want to archive this project?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.project.archive = true;
            projectService.updateProject({id: $stateParams.id}, $scope.project).$promise.then(function(res) {
                $scope.showToast("Archive project successfully!");
                $scope.closeDialog();
                $state.go("projects.archived");
                $rootScope.$broadcast("Project.Archive", res);
            }, function(err) {
                $scope.showToast("Something went wrong!");
            });
        }, function() {
            
        });
    };

    $scope.downloadBackUp = function() {
        projectService.downloadBackUp({id: $stateParams.id}).$promise.then(function(res) {
            $scope.showToast("The backup file has sent to your mailbox");
        }, function(err) {$scope.showToast(err.message);});
    };

    $scope.uploadNewDocument = function() {
        uploadService.submitTender({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
            $scope.closeDialog();
            $scope.showToast("Submit a tender successfully");
        }, function(err) {$scope.showToast("Error");});
    };

});