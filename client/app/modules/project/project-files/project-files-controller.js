angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, $stateParams, $rootScope, $mdToast, people, $state) {
    $scope.people = people;
	$scope.files = files;
	$scope.search = false;
	$scope.uploadFile = {
		files:[],
		tags:[],
		members:[]
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
    	file.type = "file";
    	$scope.uploadFile.files.push(file);
    };

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

    $scope.searchMember = function(query) {
    	var results = query ? $scope.membersList.filter(filterMember(query)) : [];
        results = _.uniq(results, '_id');
        return results;
    };

    function filterMember(query) {
        return function filterFn(member) {
            return member.name.toLowerCase().indexOf(query) > -1;
        };
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
		if ($scope.uploadFile.files.length == 0) {
			$scope.showToast("Please choose at least 1 file");
		} else if ($scope.uploadFile.tags.length == 0) {
			$scope.showToast("Please enter at least 1 tags");
		} else if ($scope.uploadFile.members.length == 0) {
			$scope.showToast("Please choose at least 1 member");
		} else {
			uploadService.upload({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
				$mdDialog.hide();
				$scope.showToast("Upload new file successfully");
                $state.go("project.files.detail", {id: res[0].project, fileId: res[0]._id});
			}, function(err) {
				$scope.showToast("Upload error");
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
	
	//Placeholder set of filters to use for layout demo
	$scope.filesFilters = ['Room1', 'Room2'];

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

	getProjectMembers($stateParams.id);
});