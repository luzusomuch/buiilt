angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, $stateParams, $rootScope, $mdToast, people, $state, socket, fileService, notificationService) {
    $scope.people = people;
	$scope.files = files;
	$scope.uploadFile = {
		tags:[],
		members:[]
	};

    function filterAcknowledgeFiles(files) {
        _.each(files, function(file) {
            var latestActivity = {};
            _.each(file.activities, function(activity) {
                if (activity.type==="upload-file" || activity.type==="upload-reversion") {
                    latestActivity = activity;
                }
            });
            if (_.findIndex(latestActivity.acknowledgeUsers, function(user) {
                if (user._id && user.isAcknow) {
                    return user._id.toString()===$rootScope.currentUser._id.toString();
                }
            })!==-1) {
                latestActivity.isAcknowledge = true;
            } else {
                latestActivity.isAcknowledge = false;
            }
            file.latestActivity = latestActivity;
        });
    };
    filterAcknowledgeFiles($scope.files);

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

    $scope.selectChip = function(index, type) {
        if (type === "member") {
            $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        }
    };

	$scope.createNewFile = function() {
        $scope.uploadFile.members = _.filter($scope.projectMembers, {select: true});
        $scope.uploadFile.tags = _.filter($scope.tags, {select: true});
		if ($scope.uploadFile.tags.length == 0) {
			$scope.showToast("Please Select At Least 1 Tag...");
		} else if ($scope.uploadFile.members.length == 0) {
			$scope.showToast("Please Select At Lease 1 Team Member...");
		} else {
            $scope.uploadFile.type="file";
			uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
				$mdDialog.hide();
				$scope.showToast("File Has Been Uploaded Successfully.");
				
				//Track New File
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("New File Created");
				
                $rootScope.$broadcast("File.Inserted", res);
                $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
			}, function(err) {
				$scope.showToast("There Has Been An Error...");
			});
		}
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewFileModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectFilesCtrl',
	      	resolve: {
		      	files: function($stateParams, fileService) {
		        	return fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise;
		      	},
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
		    },
	      	templateUrl: 'app/modules/project/project-files/new/project-files-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false
	    });
	};
	
	$scope.cancelNewFileModal = function() {
		$mdDialog.cancel();
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $rootScope.$on("File.Inserted", function(event, data) {
        $scope.files.push(data);
        filterAcknowledgeFiles($scope.files);
    });

    socket.on("file:new", function(data) {
        $scope.files.push(data);
        filterAcknowledgeFiles($scope.files);
    });

	getProjectMembers($stateParams.id);

    $scope.showViewFileModal = function($event, file) {
        // $rootScope.prjectSelectedFile = file;
        // $mdDialog.show({
        //     targetEvent: $event,
        //     controller: "projectFilesCtrl",
        //     resolve: {
        //         files: function($stateParams, fileService) {
        //             return fileService.getProjectFiles({id: $stateParams.id, type: "file"}).$promise;
        //         },
        //         people: function(peopleService, $stateParams) {
        //             return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
        //         }
        //     },
        //     templateUrl: 'app/modules/dashboard/partials/view-file.html',
        //     parent: angular.element(document.body),
        //     clickOutsideToClose: false
        // });
        var win = window.open(file.path, "_blank");
        win.focus();
    };

    if ($rootScope.prjectSelectedFile) {
        $scope.file = $rootScope.prjectSelectedFile;
        $scope.latestActivity = {};
        _.each($scope.file.activities, function(activity) {
            if (activity.type==="upload-file" || activity.type==="upload-reversion") {
                $scope.latestActivity = activity;
            }
        });
        $scope.latestActivity.isAcknowledge = false;
        if (_.findIndex($scope.latestActivity.acknowledgeUsers, function(user) {
            if (user._id && user.isAcknow) {
                return user._id.toString()===$rootScope.currentUser._id.toString();
            }
        })!==-1) {
            $scope.latestActivity.isAcknowledge = true;
        }
    }

    $scope.download = function() {
        filepicker.exportFile(
            {url: $scope.file.path, filename: $scope.file.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    };

    $scope.sendAcknowledgement = function(file) {
        fileService.acknowledgement({id: file._id, activityId: file.latestActivity._id}).$promise.then(function(res) {
            $scope.showToast("Acknowledgement Has Been Sent Successfully.");
            $scope.closeModal();
            notificationService.markItemsAsRead({id: file._id}).$promise.then(function() {
                $rootScope.$broadcast("UpdateCountNumber", {type: "file", number: file.__v});
                var currentIndex = _.findIndex($scope.files, function(f) {
                    return f._id.toString()===file._id.toString();
                });
                $rootScope.$broadcast("Project-File-Acknowledge", currentIndex);
            });
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $rootScope.$on("Project-File-Acknowledge", function(event, index) {
        $scope.files[index].element.notificationType = null;
        $scope.files[index].__v = 0;
    });
});