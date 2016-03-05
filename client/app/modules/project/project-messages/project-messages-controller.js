angular.module('buiiltApp').controller('projectMessagesCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $stateParams, $state, $mdToast, messageService, threads, people, socket, notificationService) {
	$rootScope.title = $rootScope.project.name +" messages list";
    $scope.people = people;
	$scope.threads = threads;

    // this function use to seperate non-notification and notifications
    function threadsSeperate(threads) {
        $scope.threadsWithNotification = [];
        $scope.threadsWithoutNotification = [];
        _.each(threads, function(thread) {
            if (thread.__v>0) {
                $scope.threadsWithNotification.push(thread);
            } else {
                $scope.threadsWithoutNotification.push(thread);
            }
        });
    }
    // end

    socket.on("thread:new", function(data) {
        data.__v =1;
        $scope.threads.push(data);
        $scope.threads = _.uniq($scope.threads, "_id");
    });

    socket.on("thread:archive", function(data) {
        var currentThreadIndex=_.findIndex($scope.threads, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentThreadIndex !== -1) {
            $scope.threads[currentThreadIndex].isArchive=true;
            $scope.threads[currentThreadIndex].__v = 0;
        }
    });
    
    socket.on("dashboard:new", function(data) {
        if (data.type==="thread") 
            $rootScope.$emit("Dashboard.Thread.Update", data);
    });

    // this socket fire when thread update
    function getItemIndex(array, id) {
        return _.findIndex(array, function(item) {
            return item._id.toString()===id.toString();
        });
    };

    var listenerCleanFnPush = $rootScope.$on("Thread.Inserted", function(event, data) {
        $scope.threads.push(data);
        $scope.threads = _.uniq($scope.threads, "_id"); 
    });

    var listenerCleanFnRead = $rootScope.$on("Thread.Read", function(event, data) {
        var index = _.findIndex($scope.threads, function(thread) {
            return thread._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            $scope.threads[index].__v=0;
        }
    });

    var listenerCleanFnAcknow = $rootScope.$on("Project-Message-Update", function(event, index) {
        $scope.threads[index].element.notificationType = null;
        $scope.threads[index].__v = 0;
    });

    var listenerCleanFnPushFromDashboard = $rootScope.$on("Dashboard.Thread.Update", function(event, data) {
        var index = _.findIndex($scope.threads, function(thread) {
            return thread._id.toString()===data.thread._id.toString();
        });
        if (index !== -1 && ($scope.threads[index] && $scope.threads[index].uniqId!==data.uniqId)) {
            $scope.threads[index].uniqId = data.uniqId;
            $scope.threads[index].__v+=1;
        }
    });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        listenerCleanFnRead();
        listenerCleanFnAcknow();
        listenerCleanFnPushFromDashboard();
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
        } else if ($scope.showArchived) {
            var found = (thread.isArchive) ? true: false;
            return found;
        } else {
            var found = (!thread.isArchive) ? true : false;
            return found;
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
                $rootScope.$emit("Thread.Inserted", res);
				$scope.showToast("New Message Thread Created Successfully.");
				
				//Track Message Thread Creation
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("New Message Thread Created");
				
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

    $scope.message = {};
    if ($rootScope.projectSelectedMessage) {
        $scope.selectedThread = $rootScope.projectSelectedMessage;
    }
    $scope.showReplyModal = function(event, message) {
        $rootScope.projectSelectedMessage = message;
        $mdDialog.show({
            targetEvent: event,
            controller: "projectMessagesCtrl",
            resolve: {
                threads: function($stateParams, messageService) {
                    return messageService.getProjectThread({id: $stateParams.id}).$promise;
                },
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
            templateUrl: 'app/modules/dashboard/partials/reply-message.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.sendMessage = function() {
        $scope.message.text = $scope.message.text.trim();
        if ($scope.message.text.length===0 || $scope.message.text === '') {
            $scope.showToast("Please check your message");
            return;
        } else {
            messageService.sendMessage({id: $scope.selectedThread._id}, $scope.message).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Your Message Has Been Sent Successfully.");
                
                //Track Reply Sent
                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("Reply Sent");
                
                $scope.selectedThread = $rootScope.projectSelectedMessage = res;
                notificationService.markItemsAsRead({id: res._id}).$promise.then(function() {
                    $rootScope.$emit("UpdateCountNumber", {type: "message", number: 1});
                    var currentThreadIndex = _.findIndex($scope.threads, function(message) {
                        return message._id.toString()===$scope.selectedThread._id.toString();
                    });
                    $rootScope.$emit("Project-Message-Update", currentThreadIndex);
                });
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };
});