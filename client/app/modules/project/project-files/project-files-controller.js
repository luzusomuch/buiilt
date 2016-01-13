angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, $stateParams, $rootScope, $mdToast) {
	$scope.files = files;console.log(files);
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
        $scope.membersList = [];
        peopleService.getInvitePeople({id: id}).$promise.then(function(people) { 
            if ($rootScope.currentUser.isLeader) {
                _.each($rootScope.roles, function(role) {
                    _.each(people[role], function(tender) {
                        if (tender.hasSelect) {
                            var winnerTenderer = tender.tenderers[0];
                            if (winnerTenderer._id) {
                                winnerTenderer._id.select = false;
                                $scope.membersList.push(winnerTenderer._id);
                            } else if (winnerTenderer.email) {
                                $scope.membersList.push({email: winnerTenderer.email, type: role, select: false});
                            }
                        }
                        // get employees list
                        var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                            if (tenderer._id) {
                                return tenderer._id._id == $rootScope.currentUser._id;
                            }
                        });
                        if (currentTendererIndex !== -1) {
                            var currentTenderer = tender.tenderers[currentTendererIndex];
                            _.each(currentTenderer.teamMember, function(member) {
                                member.select = false;
                                $scope.membersList.push(member);
                            });
                        }
                    });
                });
            } else {
                $scope.membersList = $rootScope.currentTeam.leader;
                _.each($rootScope.currentTeam.member, function(member) {
                    $scope.membersList.push(member);
                });
            }
            // get unique member 
            $scope.membersList = _.uniq($scope.membersList, "_id");
            // remove current user from the members list
            _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
        });
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

	$scope.createNewFile = function() {
		console.log($scope.uploadFile);
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