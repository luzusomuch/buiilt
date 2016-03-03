angular.module('buiiltApp').controller('projectDocumentationCtrl', function($rootScope, $scope, $mdDialog, documents, uploadService, $mdToast, $stateParams, socket, $state) {
    $scope.documents = documents;

    function setUploadFile(){
        $scope.uploadFile = {
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
        }  else if ($scope.showArchived) {
            var found = (document.isArchive) ? true: false;
            return found;
        } else {
            var found = (!document.isArchive) ? true : false;
            return found;
        }
    };
    // end filter

    $rootScope.$on("Document.Uploaded", function(event, data) {
        $scope.documents = _.union($scope.documents, data);
    });

    socket.on("document:new", function(data) {
        $scope.documents.push(data);
    });

    $scope.selectChip = function(index) {
        $scope.tags[index].select = !$scope.tags[index].select;
    };

	//Add a New Document to the Project
	$scope.addNewDocument = function(){
        $scope.uploadFile.tags = _.filter($scope.tags, {select: true});
        if ($scope.uploadFile.tags.length === 0) {
            $scope.showToast("Please Select At Least 1 Document Tag...");
            return;
        } else {
            $scope.uploadFile.type="document";
            uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Document Successfully Uploaded.");
                $rootScope.$broadcast("Document.Uploaded", res);
				
				//Track Document Upload
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Document Uploaded");

                $state.go("project.documentation.detail", {id: res.project._id, documentId: res._id});
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

    $scope.showViewFileModal = function($event, document) {
        // $mdDialog.show({
        //     targetEvent: $event,
        //     controller: function($scope, $mdDialog) {
        //         $scope.document = document;
        //         $scope.latestHistory = _.last($scope.document.fileHistory);
        //         $scope.closeModal = function() {
        //             $mdDialog.cancel();
        //         };

        //         $scope.download = function() {
        //             filepicker.exportFile(
        //                 {url: $scope.latestHistory.link, filename: $scope.document.name},
        //                 function(Blob){
        //                     console.log(Blob.url);
        //                 }
        //             );
        //         };
        //     },
        //     templateUrl: 'app/modules/project/project-documentation/all/view-file.html',
        //     parent: angular.element(document.body),
        //     clickOutsideToClose: false
        // });
        var win;
        if (document.owner._id==$rootScope.currentUser._id) {
            win = window.open(document.path, "_blank");
        } else {
            win = window.open(_.last(document.fileHistory).link, "_blank");
        }
        win.focus();
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