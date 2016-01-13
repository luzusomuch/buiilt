angular.module('buiiltApp').controller('projectFilesCtrl', function($scope, $timeout, $mdDialog, uploadService, files, peopleService, $stateParams, $rootScope) {
	$scope.files = files;
	$scope.search = false;
	$scope.showFileInput = false;
	$scope.uploadFiles = [];
	$scope.tags = [];
	$scope.members = [];
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
    	$scope.showFileInput = true;
    	file.tags = $scope.tags;
    	file.members = $scope.members;
    	$scope.file = file;
    	$scope.uploadFiles.push(file);
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
    	var results = value ? $scope.membersList.filter(filterMember(value)) : [];
        results = _.uniq(results, '_id');
        return results;
    };

    function filterMember(query) {
        return function filterFn(member) {
            return member.name.toLowerCase().indexOf(query) > -1;
        };
    };

	//Add a New Work Room to the Project
	$scope.createNewMessage = function() {
		console.log($scope.uploadFiles);
		$mdDialog.hide();
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

	getProjectMembers($stateParams.id);
});