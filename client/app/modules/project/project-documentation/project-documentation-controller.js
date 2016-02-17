angular.module('buiiltApp').controller('projectDocumentationCtrl', function($rootScope, $scope, $mdDialog, documents, uploadService, $mdToast, $stateParams, socket) {
    $scope.documents = documents;

    function setUploadFile(){
        $scope.uploadFile = {
            files:[],
            tags:[],
            members: []
        };
        $scope.allowUploadDocument = ($rootScope.project.projectManager._id == $rootScope.currentUser._id) ? true : false;
        $scope.tags = [];
        _.each($rootScope.currentTeam.documentTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
    };
    setUploadFile();

    // filter document
    $scope.filterTags = [];
    $scope.selectFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.search = function(document) {
        var found = false;
        if ($scope.name && $scope.name.length > 0) {
            if (document.name.toLowerCase().indexOf($scope.name) > -1 || document.name.indexOf($scope.name) > -1) {
                found = true;
            }
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(document.tags, tag) !== -1) {
                    found = true;
                }
            });
            return found;
        } else 
            return true;
    };
    // end filter

    $rootScope.$on("Document.Uploaded", function(event, data) {
        $scope.documents = _.union($scope.documents, data);
    });

    socket.on("document:new", function(data) {
        $scope.documents.push(data);
    });

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

    $scope.selectChip = function(index) {
        $scope.tags[index].select = !$scope.tags[index].select;
    };

	//Add a New Document to the Project
	$scope.addNewDocument = function(){
        $scope.uploadFile.tags = _.filter($scope.tags, {select: true});
        if ($scope.uploadFile.tags.length === 0) {
            $scope.showToast("Please Select At Least 1 Document Tag...");
            return;
        } else if ($scope.uploadFile.files.length === 0) {
            $scope.showToast("Please Select a Document to Upload...");
            return;
        } else {
            uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Document Successfully Uploaded.");
                $rootScope.$broadcast("Document.Uploaded", res);
				
				//Track Document Upload
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Document Uploaded");
				
            }, function(err){$scope.showToast("There Was an Error...");});
        }
	};
	
	//Functions to handle New Documentation Modal.
	$scope.showNewDocumentModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: "projectDocumentationCtrl",
	      	resolve: {
                documents: function($stateParams, fileService) {
                    return fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise;
                },
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
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