angular.module('buiiltApp').controller('projectMessagesCtrl', function($rootScope, $scope, $timeout, $mdDialog, peopleService, $stateParams, $state, $mdToast, messageService, threads, people, socket, notificationService, dialogService, activities) {
	$rootScope.title = $rootScope.project.name +" messages list";
    $rootScope.openDetail = false;
    $scope.people = people;
	$scope.threads = threads;
    $scope.activities = activities;
    $scope.dialogService = dialogService;
    $scope.selectedFilterEventList = [];
    $scope.selectedFilterRecepientList = [];

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
        }
        $scope.selectedFilterEventList = _.filter($scope.events, {select: true});
        $scope.selectedFilterRecepientList = _.filter($scope.assignees, {select: true});
    };

    /*Get events list for filter*/
    function repairForEventsFilter() {
        $scope.events = [];
        $scope.assignees = [];
        _.each($scope.threads, function(thread) {
            if (thread.event) {
                var index = _.findIndex($scope.activities, function(act) {
                    return thread.event==act._id;
                });
                if (index !== -1) 
                    $scope.events.push($scope.activities[index]);
            }
            $scope.assignees = _.union($scope.assignees, thread.members);
        });
        $scope.events = _.uniq($scope.events, "_id");
        $scope.assignees = _.uniq($scope.assignees, "_id");
    };
    repairForEventsFilter();
	
	$scope.showFilter = false;

    if ($state.includes("project.messages.all")) {
        messageService.getProjectThread({id: $stateParams.id}).$promise.then(function(res) {
            $scope.threads = res;
            getLastAccess($scope.threads);
        });
    }

    $scope.step = 1;
    /*check create new thread input change move to next step*/
    $scope.next = function() {
        if ($scope.step==1) {
            if (!$scope.thread.selectedEvent || !$scope.thread.name || $scope.thread.name.trim().length === 0 || !$scope.thread.message || $scope.thread.message.length ===0) {
                dialogService.showToast("Check Your Input");
            } else {
                $scope.step += 1;
            }
        }
    };

    /*Update last access to show recently first*/
    function getLastAccess(threads) {
        _.each(threads, function(thread) {
            if (thread.lastAccess&&thread.lastAccess.length>0) {
                var accessIndex = _.findIndex(thread.lastAccess, function(access) {
                    return access.user.toString()===$rootScope.currentUser._id.toString();
                });
                if (accessIndex !==-1) {
                    thread.updatedAt = thread.lastAccess[accessIndex].time;
                }
            }
        });
        threads.sort(function(a,b) {
            if (a.updatedAt < b.updatedAt) {
                return 1;
            } 
            if (a.updatedAt > b.updatedAt) {
                return -1;
            }
            return 0;
        });
    };

    getLastAccess($scope.threads);

    /*
    Receive when new thread inserted and current user is member of it
    Check if new thread is belong to current project
    */
    socket.on("thread:new", function(data) {
        if (data.project._id.toString()===$stateParams.id.toString()) {
            $scope.threads.push(data);
            $scope.threads = _.uniq($scope.threads, "_id");
            repairForEventsFilter();
        }
    });

    /*
    Receive when someone archive a thread
    Check thread is in threads list, if it's belong to
    then mark it as archive and show in archived threads list
    */
    socket.on("thread:archive", function(data) {
        var currentThreadIndex=_.findIndex($scope.threads, function(t) {
            return t._id.toString()===data._id.toString();
        });
        if (currentThreadIndex !== -1) {
            $scope.threads[currentThreadIndex].isArchive=true;
            $scope.threads[currentThreadIndex].__v = 0;
        }
    });
    
    /*Receive when update a thread*/
    socket.on("dashboard:new", function(data) {
        if (data.type==="thread") 
            $rootScope.$emit("Dashboard.Thread.Update", data);
    });

    /*Receive when owner created thread*/
    var listenerCleanFnPush = $rootScope.$on("Thread.Inserted", function(event, data) {
        $scope.threads.push(data);
        $scope.threads = _.uniq($scope.threads, "_id"); 
        repairForEventsFilter();
    });

    /*
    Receive when opened thread detail and check if it's belong to threads list
    then change it notification number to 0
    */
    var listenerCleanFnRead = $rootScope.$on("Thread.Read", function(event, data) {
        var index = _.findIndex($scope.threads, function(thread) {
            return thread._id.toString()===data._id.toString();
        });
        if (index !== -1) {
            $scope.threads[index].__v=0;
        }
    });

    /*Receive when sent a reply in reply modal and change thread notification to 0*/
    var listenerCleanFnAcknow = $rootScope.$on("Project-Message-Update", function(event, index) {
        $scope.threads[index].element.notificationType = null;
        $scope.threads[index].__v = 0;
    });

    /*
    Receive when updated thread, check updated thread notification number
    if notification number is 0 then increase count total by 1
    then keep countinue increase notification number by 1
    */
    var listenerCleanFnPushFromDashboard = $rootScope.$on("Dashboard.Thread.Update", function(event, data) {
        var index = _.findIndex($scope.threads, function(thread) {
            return thread._id.toString()===data.thread._id.toString();
        });
        if (index !== -1 && ($scope.threads[index] && $scope.threads[index].uniqId!==data.uniqId)) {
            if (data.isReplyViaEmail || (!data.isReplyViaEmail && data.user._id.toString()!==$rootScope.currentUser._id.toString())) {
                if ($scope.threads[index].__v===0) {
                    $rootScope.$emit("UpdateCountNumber", {type: "message", isAdd: true});
                }
                $scope.threads[index].uniqId = data.uniqId;
                $scope.threads[index].__v+=1;
            }
        }
    });

    $scope.$on('$destroy', function() {
        listenerCleanFnPush();
        listenerCleanFnRead();
        listenerCleanFnAcknow();
        listenerCleanFnPushFromDashboard();
    });

    /*Search thread depend on input value*/
    $scope.showArchived = false;
    $scope.search = function(thread) {
        var found = false;
        if ($scope.selectedFilterEventList.length > 0 && $scope.selectedFilterRecepientList.length > 0) {
            _.each($scope.selectedFilterEventList, function(event) {
                if (thread.event && event._id==thread.event && thread.isArchive==$scope.showArchived) {
                    _.each($scope.selectedFilterRecepientList, function(assignee) {
                        if (thread.members.length > 0 && _.findIndex(thread.members, function(member) {return member._id==assignee._id;}) !== -1 && thread.isArchive==$scope.showArchived) {
                            if ($scope.name && $scope.name.trim().length > 0) {
                                if (thread.name && thread.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                    found = true;
                                }
                            } else {
                                found = true;
                            }
                            return false
                        }
                    });
                }
            });
        } else if ($scope.selectedFilterEventList.length > 0) {
            _.each($scope.selectedFilterEventList, function(event) {
                if (thread.event && event._id==thread.event && thread.isArchive==$scope.showArchived) {
                    if ($scope.name && $scope.name.trim().length > 0) {
                        if (thread.name && thread.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                    return false
                }
            });
        } else if ($scope.selectedFilterRecepientList.length > 0) {
            _.each($scope.selectedFilterRecepientList, function(assignee) {
                if (thread.members.length > 0 && _.findIndex(thread.members, function(member) {return member._id==assignee._id;}) !== -1 && thread.isArchive==$scope.showArchived) {
                    if ($scope.name && $scope.name.trim().length > 0) {
                        if (thread.name && thread.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                            found = true;
                        }
                    } else {
                        found = true;
                    }
                    return false
                }
            });
        } else if ($scope.selectedFilterRecepientList.length === 0 && $scope.selectedFilterEventList.length === 0) {
            if (thread.isArchive && thread.isArchive==$scope.showArchived) {
                if ($scope.name && $scope.name.trim().length > 0) {
                    if (thread.name && thread.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                        found = true;
                    }
                } else {
                    found = true;
                }
            } else {
                found = true;
            }
        }
        return found;
    };

    /*Get project members list*/
	function getPeopleList() {
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
                        $scope.projectMembers.push(tender.tenderers[0]._id);
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

    getPeopleList();
	
	/*Show create new Thead modal*/
	$scope.showNewMessageModal = function() {
		$mdDialog.show({
		  	// targetEvent: $event,
	      	controller: 'projectMessagesCtrl',
	      	templateUrl: 'app/modules/project/project-messages/new/project-messages-new.html',
	      	parent: angular.element(document.body),
	      	clickOutsideToClose: false,
		    resolve: {
		      	threads: ["$stateParams","messageService" ,function($stateParams, messageService) {
		        	return messageService.getProjectThread({id: $stateParams.id}).$promise;
		      	}],
                people: ["peopleService", "$stateParams" ,function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }]
		    }
	    });
	};
    
    /*Close create new thread modal*/
    $scope.cancelNewMessageModal = function() {
        $mdDialog.cancel();
    };

    /*Receive selected event ID when create new item in calendar if existed*/
    $scope.attachEventItem = $rootScope.attachEventItem;
    if ($scope.attachEventItem) {
        $scope.attachEventItem = $rootScope.attachEventItem;
        $rootScope.selectedEvent = $scope.attachEventItem.selectedEvent;
        $rootScope.attachEventItem = null;
        $scope.showNewMessageModal();
    }

    $scope.thread = {
        members : [],
        selectedEvent: ($rootScope.selectedEvent) ? $rootScope.selectedEvent : null
    };

    /*Select project members for create new thread*/
	$scope.selectMember = function(index, type) {
        if (type === "member") {
		    $scope.projectMembers[index].select = !$scope.projectMembers[index].select;
        }
	};	

    /*
    Creat new thread when form valid 
    then call mixpanel to track current user has create new Thread
    and go to the thread detail
    */
	$scope.addNewThread = function(form) {
		// if (form.$valid) {
		    $scope.thread.members = _.filter($scope.projectMembers, {select: true});
			$scope.thread.type = "project-message";
			messageService.create({id: $stateParams.id},$scope.thread).$promise.then(function(res) {
				$scope.cancelNewMessageModal();
                $rootScope.$emit("Thread.Inserted", res);
				$scope.showToast("New Message Thread Created Successfully.");
				
				//Track Message Thread Creation
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("New Message Thread Created");
				$rootScope.openDetail = true;
				$state.go("project.messages.detail", {id: $stateParams.id, messageId: res._id});
			}, function(err) {
				$scope.showToast("There Has Been An Error...")
			});
		// }
	};

    /*Show a toast inforation*/
	$scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
	
    $scope.message = {};
    if ($rootScope.projectSelectedMessage) {
        $scope.selectedThread = $rootScope.projectSelectedMessage;
    }
    /*Show reply message modal with a messages list*/
    $scope.showReplyModal = function(event, message) {
        $rootScope.projectSelectedMessage = message;
        $mdDialog.show({
            targetEvent: event,
            controller: "projectMessagesCtrl",
            resolve: {
                threads: ["$stateParams","messageService" ,function($stateParams, messageService) {
                    return messageService.getProjectThread({id: $stateParams.id}).$promise;
                }],
                people: ["peopleService", "$stateParams" ,function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/dashboard/partials/reply-message.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*
    Used in show messages modal
    Check if message text is not empty and sent then
    call mixpanel track current user has sent reply and mark all notifications
    which related to selected thread as read
    */
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