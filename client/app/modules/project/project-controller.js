angular.module('buiiltApp').controller('projectCtrl', function($rootScope, $scope, $timeout, $state, projectService, $mdDialog, $stateParams, $mdToast, filepickerService, uploadService) {
    projectService.get({id: $stateParams.id}).$promise.then(function(res) {
    	$rootScope.project = $scope.project = res;
        $rootScope.title = $scope.project.name + " Overview";
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

    $scope.uploadFiles = [];
    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(files){
        _.each(files, function(file) {
            file.belongToType = ($scope.package) ? $scope.package.type : 'project';
            file.tags = [];
        });
        $scope.uploadFiles = files;
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
        console.log($scope.uploadFiles);
    };

});