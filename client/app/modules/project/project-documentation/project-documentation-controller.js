angular.module('buiiltApp').controller('projectDocumentationCtrl', function($rootScope, $scope, $mdDialog, documents, uploadService, $mdToast, $stateParams) {
    $scope.documents = documents;

    function setUploadFile(){
        $scope.uploadFile = {
            files:[],
            tags:[]
        };
        $scope.allowUploadDocument = ($rootScope.project.projectManager._id == $rootScope.currentUser._id) ? true : false;
    };
    setUploadFile();

    $rootScope.$on("Document.Uploaded", function(event, data) {
        $scope.documents = _.union($scope.documents, data);
    });

    $scope.validTags = ["Architectural", "Engineering", "Council", "Certification", "Others"];
    $scope.pickFile = pickFile;
    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
        	// add max files for multiple pick
            {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(files){
        _.each(files, function(file) {
            file.type = "document";
        });
    	$scope.uploadFile.files = files;
    };

	//Add a New Document to the Project
	$scope.addNewDocument = function(){
        if ($scope.uploadFile.tags.length === 0) {
            $scope.showToast("Please enter at least 1 tag");
            return;
        } else if ($scope.uploadFile.files.length === 0) {
            $scope.showToast("Please select at least 1 document");
            return;
        } else {
            uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Upload new document successfully");
                $rootScope.$broadcast("Document.Uploaded", res);
            }, function(err){$scope.showToast("Error");});
        }
	};
	
	$scope.searchTag = function(value) {
		var results = value ? $scope.validTags.filter(filterMember(value)) : [];
        results = _.uniq(results);
        return results;
	};

	function filterMember(query) {
        return function filterFn(value) {
            return value.toLowerCase().indexOf(query) > -1;
        };
    };
	
	//Functions to handle New Documentation Modal.
	$scope.showNewDocumentModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: "projectDocumentationCtrl",
	      	resolve: {
                documents: function($stateParams, fileService) {
                    return fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise;
                }
            },
	      	templateUrl: 'app/modules/project/project-documentation/new/project-documentation-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.closeModal = function(){
		$mdDialog.cancel();
	};

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
	
	//Placeholder set of filters to use for layout demo
	$scope.docTypes = [];
	
});