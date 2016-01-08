angular.module('buiiltApp').controller('projectMessagesCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $stateParams, $state, $mdToast, messageService, threads) {
	$rootScope.title = $rootScope.project.name +" messages list";
	$scope.threads = threads;
	$scope.searchResults = [];
	$scope.autoCompleteRequireMath = true;
    $scope.selectedItem = null;
    $scope.search = false;
	$scope.messageFilter = [];

	function getPeopleList(id) {
		$scope.projectMembers = [];
		peopleService.getInvitePeople({id: id}).$promise.then(function(people){
			var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
			_.each(roles, function(role) {
				_.each(people[role], function(tender){
					if (tender.hasSelect) {
						tender.tenderers[0]._id.select = false;
						$scope.projectMembers.push(tender.tenderers[0]._id);
						if (tender.tenderers[0].teamMember.length > 0 && tender.tenderers[0]._id._id == $rootScope.currentUser._id) {
							_.each(tender.tenderers[0].teamMember, function(member) {
								member.select = false;
								$scope.projectMembers.push(member);
							});
						}
					}
				});
			});
			_.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
		});
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewMessageModal = function($event) {
		$scope.thread = {
			members : []
		};
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectMessagesCtrl',
	      	templateUrl: 'app/modules/project/project-messages/new/project-messages-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false,
		    resolve: {
		      	threads: function($stateParams, messageService) {
		        	return messageService.getProjectThread({id: $stateParams.id}).$promise;
		      	}
		    }
	    });
	};
	
	$scope.cancelNewMessageModal = function() {
		$mdDialog.cancel();
	};

	$scope.selectMember = function(index) {
		$scope.projectMembers[index].select = !$scope.projectMembers[index].select;
	};	

	$scope.addNewThread = function(form) {
		if (form.$valid) {
			$scope.thread.members = _.filter($scope.projectMembers, function(member) {
				return member.select == true;
			});
			$scope.thread.type = "project-message";
			messageService.create({id: $stateParams.id},$scope.thread).$promise.then(function(res) {
				$scope.cancelNewMessageModal();
				$scope.showToast("Create new thread successfully!");
				$state.go("project.messages.detail", {id: $stateParams.id, messageId: res._id});
			}, function(err) {
				$scope.showToast("Something went wrong!.")
			});
		}
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
	
    $scope.messageChips = [
        {place: "message", value: "createdByMe", text: "CREATED BY ME", select: false},
        {place: "message", value: "mentionsMe", text: "MENTIONS ME", select: false}
    ];

    $scope.querySearch = function(value) {
    	var results = value ? $scope.threads.filter(createFilter(value)) : [];
        results = _.uniq(results, '_id');
        $scope.searchResults = results;
        return results;
    };

    function createFilter(query) {
        return function filterFn(thread) {
            return thread.name.toLowerCase().indexOf(query) > -1;
        };
    };

    $scope.addChip = function() {
        $scope.search = true;
    };

    var lastFilterResults = [];
    $scope.selectedChip = function(chip) {
    	chip.select = !chip.select;
    	$scope.search = true;
    	if (chip.select) {
    		switch (chip.value) {
    			case "createdByMe":
    				_.each($scope.threads, function(thread) {
    					if (thread.owner._id == $rootScope.currentUser._id) {
    						lastFilterResults.push(thread);
    						getHandleArr(thread);
    					}
    				});
    			break;

    			case "mentionsMe":
    				_.each($scope.threads, function(thread) {
    					_.each(thread.messages, function(message) {
                            if (message.mentions && message.mentions.length > 0) {
                                if (_.indexOf(message.mentions, $rootScope.currentUser._id) !== -1) {
                                    getHandleArr(thread);
                                    lastFilterResults.push(thread);
                                    return false;
                                }
                            }
                        });
    				});
    			break;

    			default:
    			break;
    		}
    	} else {
    		if (lastFilterResults.length > 0 && $scope.searchResults.length > 0) {
                _.each(lastFilterResults, function(index, result) {
                    $scope.searchResults = _.remove($scope.searchResults, function(item) {
                        return item._id == result._Id;
                    });
                    lastFilterResults.splice(index, 1);
                    if ($scope.searchResults.length == 0) {
                        $scope.search = false;
                    }
                });
            } else if (lastFilterResults.length == 0) {
            	$scope.search = false;
            }
    	}
    };

    $scope.$watch('searchResults', function(value) {
    	if (value.length == 0) {
    		$scope.search = false;
    	} else {
    		$scope.search = true;
    	}
    });

    function getHandleArr(item) {
        $scope.searchResults.push(item);
        return $scope.searchResults = _.uniq($scope.searchResults, '_id');
    };
	
	getPeopleList($stateParams.id);
});