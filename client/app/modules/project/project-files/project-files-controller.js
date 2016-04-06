angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, $stateParams, $rootScope, $mdToast, people, $state, socket, fileService, notificationService) {
    $scope.people = people;
	$scope.files = files;
	$scope.uploadFile = {
		tags:[],
		members:[]
	};
	
	$scope.showFilter = false;

    if ($state.includes("project.files.all")) {
        fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise.then(function(res) {
            $scope.files = res;
            getLastAccess($scope.files);
        });
    }

    /*Get last access of current user in files list to show recently first*/
    function getLastAccess(files) {
        _.each(files, function(file) {
            if (file.lastAccess&&file.lastAccess.length>0) {
                var accessIndex = _.findIndex(file.lastAccess, function(access) {
                    return access.user.toString()===$rootScope.currentUser._id.toString();
                });
                if (accessIndex !==-1) {
                    file.createdAt = file.lastAccess[accessIndex].time;
                }
            }
        });
    };
    getLastAccess($scope.files);

    /*Receive when new file inserted and current user assigned as file members*/
    socket.on("file:new", function(data) {
        if (data.project._id.toString()===$stateParams.id.toString()) {
            data.__v=1;
            $scope.files.push(data);
        }
    });

    /*Receive when file archived then move that file to archived files list*/
    socket.on("file:archive", function(data) {
        var currentFileIndex=_.findIndex($scope.files, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentFileIndex !== -1) {
            $scope.files[currentFileIndex].isArchive=true;
            $scope.files[currentFileIndex].__v = 0;
        }
    });

    /*Receive when file updated then update count total*/
    socket.on("dashboard:new", function(data) {
        if (data.type==="file" && data.file.element.type==="file") 
            $rootScope.$emit("Dashboard.File.Update", data);
    });

    /*Receive when current user open file detail
    then update that file notification to 0*/
    var listenerCleanFnRead = $rootScope.$on("File.Read", function(event, data) {
        var index = _.findIndex($scope.files, function(file) {
            return file._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            $scope.files[index].__v=0;
        }
    });

    /*Receive when owner created file*/
    var listenerCleanFnPush = $rootScope.$on("File.Inserted", function(event, data) {
        $scope.files.push(data);
    });

    /*Receive when file updated then update notification of file increase 1*/
    var listenerCleanFnPushFromDashboard = $rootScope.$on("Dashboard.File.Update", function(event, data) {
        var index = _.findIndex($scope.files, function(file) {
            return file._id.toString()===data.file._id.toString();
        });
        if (index !== -1 && data.user._id.toString()!==$rootScope.currentUser._id.toString() && ($scope.files[index] && $scope.files[index].uniqId!==data.uniqId)) {
            $scope.files[index].uniqId = data.uniqId;
            $scope.files[index].__v+=1;
        }
    });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        listenerCleanFnRead();
        listenerCleanFnPushFromDashboard();
    });

    // filter section
    $scope.filterTags = [];
    $scope.selectFilterTag = function(tagName) {
        var tagIndex = _.indexOf($scope.filterTags, tagName);
        if (tagIndex !== -1) {
            $scope.filterTags.splice(tagIndex, 1);
        } else 
            $scope.filterTags.push(tagName);
    };

    $scope.search = function(file) {
        var found = false;
        if (($scope.name && $scope.name.length > 0) || ($scope.recipient && $scope.recipient.length > 0)) {
            if ($scope.name) {
                if (file.name.toLowerCase().indexOf($scope.name) > -1 || file.name.indexOf($scope.name) > -1) {
                    found = true;
                }
            } else if ($scope.recipient) {
                if (_.findIndex(file.members, function(member) {
                    return ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1));
                }) !== -1) {
                    found = true;
                } else if (_.findIndex(file.notMembers, function(member) {
                    return member.indexOf($scope.recipient) > -1;
                }) !== -1) {
                    found = true;
                }
            } 
            return found;
        } else if ($scope.filterTags.length > 0) {
            _.each($scope.filterTags, function(tag) {
                if (_.indexOf(file.tags, tag) !== -1) {
                    found = true;
                }
            })
            return found;
        } else if ($scope.showArchived) {
            var found = (file.isArchive) ? true: false;
            return found;
        } else {
            var found = (!file.isArchive) ? true : false;
            return found;
        }
    };
    // end filter section

    /*Get project members list and file tags list*/
    function getProjectMembers(id) {
        $scope.projectMembers = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
        _.each($rootScope.roles, function(role) {
            _.each($scope.people[role], function(tender){
                if (tender.hasSelect) {
                    var isLeader = (_.findIndex(tender.tenderers, function(tenderer) {
                        if (tenderer._id) {
                            return tenderer._id._id.toString() === $rootScope.currentUser._id.toString();
                        }
                    }) !== -1) ? true : false;
                    if (!isLeader) {
                        _.each(tender.tenderers, function(tenderer) {
                            var memberIndex = _.findIndex(tenderer.teamMember, function(member) {
                                return member._id.toString() === $rootScope.currentUser._id.toString();
                            });
                            if (memberIndex !== -1) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.projectMembers.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            $scope.projectMembers.push(tender.tenderers[0]._id);
                        } else {
                            $scope.projectMembers.push({email: tender.tenderers[0].email, select: false});
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.projectMembers.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        _.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
    };

    /*Select project members or file tags to assign to current file or new file*/
    $scope.selectChip = function(index, type) {
        if (type === "member") {
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        }
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            // add max files for multiple pick
            // {maxFiles: 5},
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadFile.file = file;
    };

    /*Create new file with valid tags and members
    then call mixpanel to track current user has created new file
    and go to new file detail*/
	$scope.createNewFile = function() {
        $scope.uploadFile.members = _.filter($scope.projectMembers, {select: true});
        $scope.uploadFile.tags = _.filter($scope.tags, {select: true});
		if ($scope.uploadFile.tags.length == 0) {
			$scope.showToast("Please Select At Least 1 Tag...");
            return;
		} else if ($scope.uploadFile.members.length == 0) {
			$scope.showToast("Please Select At Lease 1 Team Member...");
            return;
		} else if (!$scope.uploadFile.file) {
            $scope.showToast("Please Select A File");
            return;
        } else {
            $scope.uploadFile.type="file";
			uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
				$mdDialog.hide();
				$scope.showToast("File Has Been Uploaded Successfully.");
				
				//Track New File
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("New File Created");
				
                $rootScope.$emit("File.Inserted", res);
                $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
			}, function(err) {
				$scope.showToast("There Has Been An Error...");
			});
		}
	};
	
	/*Open create new file modal*/
	$scope.showNewFileModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectFilesCtrl',
	      	resolve: {
		      	files: ["$stateParams", "fileService",function($stateParams, fileService) {
		        	return fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise;
		      	}],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
		    },
	      	templateUrl: 'app/modules/project/project-files/new/project-files-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
    /*Close create new file modal*/
	$scope.cancelNewFileModal = function() {
		$mdDialog.cancel();
	};

    /*Show a toast dialog with inform*/
	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

	getProjectMembers();

    /*When click on eye icon, it'll open current file version in a new window*/
    $scope.showViewFileModal = function($event, file) {
        var win = window.open(file.path, "_blank");
        win.focus();
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };
});