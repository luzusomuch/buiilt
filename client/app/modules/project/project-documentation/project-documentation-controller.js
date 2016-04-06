angular.module('buiiltApp').controller('projectDocumentationCtrl', function($rootScope, $scope, $mdDialog, documents, uploadService, $mdToast, $stateParams, socket, $state, fileService) {
    $scope.documents = documents;
	
	$scope.showFilter = false;

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

    if ($state.includes("project.documentation.all")) {
        fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise.then(function(res) {
            $scope.documents = res;
            getLastAccess($scope.documents);
        });
    }

    /*Get last access of user for each document to show recently open first*/
    function getLastAccess(documents) {
        _.each(documents, function(document) {
            if (document.lastAccess&&document.lastAccess.length>0) {
                var accessIndex = _.findIndex(document.lastAccess, function(access) {
                    return access.user.toString()===$rootScope.currentUser._id.toString();
                });
                if (accessIndex !==-1) {
                    document.createdAt = document.lastAccess[accessIndex].time;
                }
            }
        });
    };
    getLastAccess($scope.documents);

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

    /*Receive when owner created new document*/
    var listenerCleanFnPush = $rootScope.$on("Document.Uploaded", function(event, data) {
        $scope.documents.push(data);
    });

    /*Receive when user open document detail then update this document notification
    to 0*/
    var listenerCleanFnRead = $rootScope.$on("Document.Read", function(event, data) {
        var index = _.findIndex($scope.documents, function(document) {
            return document._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            $scope.documents[index].__v=0;
        }
    });

    /*Receive when updated document then check if document is belong to current project
    then check if document is existed in documents list
    after that update count number and update notifications list*/
    var listenerCleanFnPushFromDashboard = $rootScope.$on("Dashboard.Document.Update", function(event, data) {
        if (data.file.project._id.toString()===$stateParams.id.toString()) {
            var index = _.findIndex($scope.documents, function(document) {
                return document._id.toString()===data.file._id.toString();
            });
            if (index !== -1 && ($scope.documents[index] && $scope.documents[index].uniqId!==data.uniqId)) {
                $scope.documents[index].uniqId = data.uniqId;
                $scope.documents[index].__v+=1;
                if ($scope.documents[index].__v===0) {
                    $rootScope.$broadcast("UpdateCountNumber", {type: "document", isAdd: true, number: 1});
                }
            } else if (index === -1) {
                data.file.__v = 1;
                data.file.uniqId = data.uniqId;
                $scope.documents.push(data.file);
                var notificationDocuments = _.filter($scope.documents, function(document) {
                    return document.__v > 0;
                });
                $rootScope.$broadcast("UpdateCountNumber", {type: "document", isList: true, number: notificationDocuments.length});
            }
        }
    });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        listenerCleanFnRead();
        listenerCleanFnPushFromDashboard();
    });

    /*Receive when archived document then move it to archived list*/
    socket.on("document:archive", function(data) {
        var currentFileIndex=_.findIndex($scope.documents, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentFileIndex !== -1) {
            $scope.documents[currentFileIndex].isArchive=true;
            $scope.documents[currentFileIndex].__v = 0;
        }
    });

    /*Receive when updated document*/
    socket.on("dashboard:new", function(data) {
        if (data.type==="file" && data.file.element.type==="document") 
            $rootScope.$emit("Dashboard.Document.Update", data);
    });
    
    /*Select document tags to create new document*/
    $scope.selectChip = function(index) {
        $scope.tags[index].select = !$scope.tags[index].select;
    };

	/*Create new document with valid tags
    then call mixpanel to track current user has created new document
    and open document detail*/
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
                $rootScope.$emit("Document.Uploaded", res);
				
				//Track Document Upload
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Document Uploaded");

                $state.go("project.documentation.detail", {id: res.project._id, documentId: res._id});
            }, function(err){$scope.showToast("There Was an Error...");});
        }
	};
	
	/*Show create new document modal*/
	$scope.showNewDocumentModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: "projectDocumentationCtrl",
	      	resolve: {
                documents: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.getProjectFiles({id: $stateParams.id, type: "document"}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
            },
	      	templateUrl: 'app/modules/project/project-documentation/new/project-documentation-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};

    /*Open latest document history in new window*/
    $scope.showViewFileModal = function($event, document) {
        var win;
        if (document.owner._id==$rootScope.currentUser._id) {
            win = window.open(document.path, "_blank");
        } else {
            win = window.open(_.last(document.fileHistory).link, "_blank");
        }
        win.focus();
    };
	
    /*Close opening modal*/
	$scope.closeModal = function(){
		$mdDialog.cancel();
	};

    /*Show a toast dialog with inform*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
});