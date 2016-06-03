angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, dialogService, $stateParams, $rootScope, $mdToast, people, $state, socket, fileService, notificationService, activities) {
    $scope.hasPrivilageInProjectMember = $rootScope.checkPrivilageInProjectMember(people);

    $scope.dialogService = dialogService;
    $scope.people = people;
	$scope.files = files;
    $scope.activities = activities;
	$scope.uploadFile = {
		tags:[],
		members:[],
        selectedEvent: ($rootScope.selectedEvent) ? $rootScope.selectedEvent : null
	};
    $scope.selectedFilterEventsList = [];
    $scope.selectedFilterAssigneesList = [];
    $scope.selectedFilterTagsList = [];

    $scope.changeFilter = function(type, isCheckAll, dataId) {
        if (type==="event") {
            if (isCheckAll) {
                _.each($scope.events, function(ev) {
                    ev.select = false;
                });
            } else {
                var index = _.findIndex($scope.events, function(ev) {
                    return ev._id==dataId;
                });
                $scope.events[index].select = !$scope.events[index].select;
            }
        } else if (type==="recepient") {
            if (isCheckAll) {
                _.each($scope.assignees, function(assignee) {
                    assignee.select = false;
                });
            } else {
                var index = _.findIndex($scope.assignees, function(assignee) {
                    return assignee._id==dataId;
                });
                $scope.assignees[index].select = !$scope.assignees[index].select;
            }
        } else if (type==="tag") {
            if (isCheckAll) {
                _.each($scope.tags, function(tag) {
                    tag.select = false;
                });
            } else {
                var index = _.findIndex($scope.tags, function(tag) {
                    return tag.name==dataId;
                });
                $scope.tags[index].select = !$scope.tags[index].select;
            }
        }
        $scope.selectedFilterEventsList = _.filter($scope.events, {select: true});
        $scope.selectedFilterAssigneesList = _.filter($scope.assignees, {select: true});
        $scope.selectedFilterTagsList = _.filter($scope.tags, {select: true});
    };

    /*Get events list for filter*/
    function repairForEventsFilter() {
        $scope.events = [];
        $scope.assignees = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag});
        });
        _.each($scope.files, function(file) {
            if (file.event) {
                var index = _.findIndex($scope.activities, function(act) {
                    return file.event==act._id;
                });
                if (index !== -1)
                    $scope.events.push($scope.activities[index]);
            }
            $scope.assignees = _.union($scope.assignees, file.members);
        });
        $scope.events = _.uniq($scope.events, "_id");
        $scope.assignees = _.uniq($scope.assignees, "_id");

        if ($rootScope.selectedFilterEvent) {
            var index = _.findIndex($scope.events, function(ev) {
                return ev._id.toString()===$rootScope.selectedFilterEvent.toString();
            });
            $scope.events[index].select = true;
            $rootScope.selectedFilterEvent = null;
        } else {
            $rootScope.refreshData($scope.events);
        }
        $scope.selectedFilterEventsList = _.filter($scope.events, {select: true});
    };
    repairForEventsFilter();
	
	$scope.showFilter = false;

    $scope.step=1;
    /*check create new task input change move to next step*/
    $scope.next = function() {
        if ($scope.step==1) {
            if (!$scope.uploadFile.selectedEvent || !$scope.uploadFile.file || !$scope.uploadFile.file.filename || $scope.uploadFile.file.filename.trim().length === 0) {
                dialogService.showToast("Check Your Input");
            } else {
                $scope.step += 1;
            }
        }
    };

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
            data.__v=0;
            $scope.files.push(data);
            repairForEventsFilter();
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
        if (data.type==="file" && data.file.element.type==="file") {
            var index = _.findIndex($scope.files, function(file) {
                return file._id.toString()===data.file._id.toString();
            });
            if (index !== -1 && data.user._id.toString()!==$rootScope.currentUser._id.toString() && ($scope.files[index] && $scope.files[index].uniqId!==data.uniqId)) {
                $scope.files[index].uniqId = data.uniqId;
                if ($scope.files[index].__v===0) {
                    $rootScope.$emit("UpdateCountNumber", {type: "file", isAdd: true});
                }
                $scope.files[index].__v+=1;
            }
        } else if (data.type==="related-item") {
            var index = _.findIndex($scope.files, function(thread) {
                return thread._id.toString()===data.belongTo.toString();
            });
            if (index !==-1) {
                if ($scope.files[index].__v===0) {
                    $rootScope.$emit("UpdateCountNumber", {type: "file", isAdd: true});
                }
                $scope.files[index].__v+=1;
            }
        }
            // $rootScope.$emit("Dashboard.File.Update", data);
    });

    /*Receive when current user open file detail
    then update that file notification to 0*/
    $rootScope.$on("File.Read", function(event, data) {
        var index = _.findIndex($scope.files, function(file) {
            return file._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            if ($scope.files[index].__v > 0) {
                $rootScope.$emit("UpdateCountNumber", {type: "file", number: 1});
            }
            $scope.files[index].__v=0;
        }
    });

    /*Receive when owner created file*/
    var listenerCleanFnPush = $rootScope.$on("File.Inserted", function(event, data) {
        $scope.files.push(data);
        repairForEventsFilter();
    });

    /*Receive when file updated then update notification of file increase 1*/
    // var listenerCleanFnPushFromDashboard = $rootScope.$on("Dashboard.File.Update", function(event, data) {
        
    // });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        // listenerCleanFnRead();
        // listenerCleanFnPushFromDashboard();
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

    $scope.showArchived = false;
    $scope.search = function(file) {
        var found = false;
        if ($scope.selectedFilterEventsList.length > 0 && $scope.selectedFilterAssigneesList.length > 0 && $scope.selectedFilterTagsList.length > 0) {
            if (file.isArchive==$scope.showArchived && file.event && file.members.length > 0 && file.tags.length > 0) {
                _.each($scope.selectedFilterEventsList, function(event) {
                    if (event._id==file.event) {
                        _.each($scope.selectedFilterAssigneesList, function(assignee) {
                            if (_.findIndex(file.members, function(member) {return member._id==assignee._id}) !== -1) {
                                _.each($scope.selectedFilterTagsList, function(tag) {
                                    if (file.tags.indexOf(tag.name) !== -1) {
                                        if ($scope.name && $scope.name.trim().length > 0) {
                                            if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                                found = true;
                                            }
                                        } else {
                                            found = true;
                                        }
                                        return false;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else if ($scope.selectedFilterEventsList.length > 0 && $scope.selectedFilterAssigneesList.length > 0) {
            if (file.isArchive==$scope.showArchived && file.event && file.members.length > 0) {
                _.each($scope.selectedFilterEventsList, function(event) {
                    if (event._id==file.event) {
                        _.each($scope.selectedFilterAssigneesList, function(assignee) {
                            if (_.findIndex(file.members, function(member) {return member._id==assignee._id}) !== -1) {
                                if ($scope.name && $scope.name.trim().length > 0) {
                                    if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                        found = true;
                                    }
                                } else {
                                    found = true;
                                }
                                return false;
                            }
                        });
                    }
                });
            }
        } else if ($scope.selectedFilterEventsList.length > 0 && $scope.selectedFilterTagsList.length > 0) {
            if (file.isArchive==$scope.showArchived && file.event && file.tags.length > 0) {
                _.each($scope.selectedFilterEventsList, function(event) {
                    if (event._id==file.event) {
                        _.each($scope.selectedFilterTagsList, function(tag) {
                            if (file.tags.indexOf(tag.name) !== -1) {
                                if ($scope.name && $scope.name.trim().length > 0) {
                                    if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                        found = true;
                                    }
                                } else {
                                    found = true;
                                }
                                return false;
                            }
                        });
                    }
                });
            }
        } else if ($scope.selectedFilterAssigneesList.length > 0 && $scope.selectedFilterTagsList.length > 0) {
            if (file.isArchive==$scope.showArchived && file.members.length > 0 && file.tags.length > 0) {
                _.each($scope.selectedFilterAssigneesList, function(assignee) {
                    if (_.findIndex(file.members, function(member) {return member._id==assignee._id;}) !== -1 && file.isArchive==$scope.showArchived) {
                        _.each($scope.selectedFilterTagsList, function(tag) {
                            if (file.tags.indexOf(tag.name) !== -1) {
                                if ($scope.name && $scope.name.trim().length > 0) {
                                    if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                        found = true;
                                    }
                                } else {
                                    found = true;
                                }
                                return false;
                            }
                        });
                    }
                });
            }
        } else if ($scope.selectedFilterEventsList.length > 0) {
            _.each($scope.selectedFilterEventsList, function(event) {
                if (file.event && event._id==file.event && file.isArchive==$scope.showArchived) {
                    if ($scope.name && $scope.name.trim().length > 0) {
                        if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                    return false
                }
            });
        } else if ($scope.selectedFilterTagsList.length > 0) {
            _.each($scope.selectedFilterTagsList, function(tag) {
                if (file.isArchive==$scope.showArchived && file.tags.indexOf(tag.name) !== -1) {
                    if ($scope.name && $scope.name.trim().length > 0) {
                        if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                    return false
                }
            });
        } else if ($scope.selectedFilterAssigneesList.length > 0) {
            _.each($scope.selectedFilterAssigneesList, function(assignee) {
                if (file.members.length > 0 && _.findIndex(file.members, function(member) {return member._id==assignee._id;}) !== -1 && file.isArchive==$scope.showArchived) {
                    if ($scope.name && $scope.name.trim().length > 0) {
                        if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                    return false
                }
            });
        } else if ($scope.selectedFilterEventsList.length === 0 && $scope.selectedFilterAssigneesList.length === 0 && $scope.selectedFilterTagsList.length === 0) {
            if (file.isArchive==$scope.showArchived) {
                if ($scope.name && $scope.name.trim().length > 0) {
                    if (file.name && file.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                        found = true;
                    }
                } else {
                    found = true;
                }
            }
        }
        return found;
    };
    // end filter section

    /*Get project members list and file tags list*/
    function getProjectMembers(id) {
        $scope.projectMembers = [];
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

    // $scope.pickFile = pickFile;

    // $scope.onSuccess = onSuccess;

    // function pickFile(){
    //     filepickerService.pick(
    //         // add max files for multiple pick
    //         // {maxFiles: 5},
    //         onSuccess
    //     );
    // };

    // function onSuccess(file){
    //     $scope.uploadFile.file = file;
    // };

    /*Create new file with valid tags and members
    then call mixpanel to track current user has created new file
    and go to new file detail*/
	$scope.createNewFile = function() {
        if (!$scope.hasPrivilageInProjectMember) {
            return dialogService.showToast("Not Allow");
        }
        $scope.uploadFile.members = [];
        $scope.uploadFile.tags = [];
        $scope.uploadFile.type="file";
		fileService.create({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
			dialogService.closeModal();
			dialogService.showToast("File Has Been Uploaded Successfully.");
			
			//Track New File
			mixpanel.identify($rootScope.currentUser._id);
			mixpanel.track("New File Created");
			$rootScope.openDetail = true;
            $rootScope.$emit("File.Inserted", res);
            $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
		}, function(err) {
			dialogService.showToast("There Has Been An Error...");
		});
	};
	
	/*Open create new file modal*/
	$scope.showNewFileModal = function() {
		$mdDialog.show({
		  	// targetEvent: $event,
	      	controller: 'projectFilesCtrl',
	      	resolve: {
		      	files: ["$stateParams", "fileService",function($stateParams, fileService) {
		        	return fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise;
		      	}],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }]
		    },
	      	templateUrl: 'app/modules/project/project-files/new/project-files-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};

    // $scope.attachEventItem = $rootScope.attachEventItem;
    // if ($scope.attachEventItem) {
    //     $scope.attachEventItem = $rootScope.attachEventItem;
    //     $rootScope.selectedEvent = $scope.attachEventItem.selectedEvent;
    //     $rootScope.attachEventItem = null;
    //     $scope.showNewFileModal();
    // }
	
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