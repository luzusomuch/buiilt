angular.module('buiiltApp').controller('projectMessagesCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $stateParams, $state, $mdToast, messageService, threads, people, socket) {
	$rootScope.title = $rootScope.project.name +" messages list";
    $scope.people = people;
	$scope.threads = threads;

    socket.on("thread:new", function(data) {
        $scope.threads.push(data);
        $scope.threads = _.uniq($scope.threads, "_id");
    });

    // filter section
    $scope.search = function(thread) {
        if ($scope.name && $scope.name.length > 0) {
            var found = false;
            if (thread.name.toLowerCase().indexOf($scope.name) > -1 || thread.name.indexOf($scope.name) > -1) {
                found = true
            }
            return found;
        } else if ($scope.recipient && $scope.recipient.length > 0) {
            var found = false;
            if (thread.members && thread.members.length > 0) {
                _.each(thread.members, function(member) {
                    if ((member.name.toLowerCase().indexOf($scope.recipient) > -1 || member.name.indexOf($scope.recipient) > -1) || (member.email.toLowerCase().indexOf($scope.recipient) > -1 || member.email.indexOf($scope.recipient) > -1)) {
                        found = true;
                    }
                });
            }
            if (thread.notMembers && thread.notMembers.length > 0) {
                _.each(thread.notMembers, function(email) {
                    if (email.toLowerCase().indexOf($scope.recipient) > -1) {
                        found = true;
                    }
                });
            }
            return found;
        } else if ($scope.reply && $scope.reply.length > 0) {
            var found = false;
            _.each(thread.messages, function(message) {
                if (message.text.toLowerCase().indexOf($scope.reply) > -1 || message.text.indexOf($scope.reply) > -1) {
                    found = true;
                }
            });
            return found;
        } else {
            return true;
        }
    };
    // end filter section

	function getPeopleList(id) {
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
        $scope.projectMembers = _.uniq($scope.projectMembers, "email");
		_.remove($scope.projectMembers, {_id: $rootScope.currentUser._id});
	};
	
	//Functions to handle New Work Room Dialog.
	$scope.showNewMessageModal = function($event) {
		$mdDialog.show({
		  	targetEvent: $event,
	      	controller: 'projectMessagesCtrl',
	      	templateUrl: 'app/modules/project/project-messages/new/project-messages-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false,
		    resolve: {
		      	threads: function($stateParams, messageService) {
		        	return messageService.getProjectThread({id: $stateParams.id}).$promise;
		      	},
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
		    }
	    });
	};

    
    $scope.cancelNewMessageModal = function() {
        $mdDialog.cancel();
    };

    function setThread() {
        $scope.thread = {
            members : []
        };
    };
    setThread();
	$scope.selectMember = function(index, type) {
        if (type === "member") {
		    $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        }
	};	

	$scope.addNewThread = function(form) {
		if (form.$valid) {
		    $scope.thread.members = _.filter($scope.projectMembers, {select: true});
			$scope.thread.type = "project-message";
			messageService.create({id: $stateParams.id},$scope.thread).$promise.then(function(res) {
				$scope.cancelNewMessageModal();
				$scope.showToast("New Message Thread Created Successfully.");
				$state.go("project.messages.detail", {id: $stateParams.id, messageId: res._id});
			}, function(err) {
				$scope.showToast("There Has Been An Error...")
			});
		}
	};

	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
	
	getPeopleList($stateParams.id);
});