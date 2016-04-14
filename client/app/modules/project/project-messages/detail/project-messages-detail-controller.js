angular.module('buiiltApp').controller('projectMessagesDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, messageService, $mdToast, $mdDialog, $state, thread, peopleService, taskService, uploadService, people, clipboard, socket, notificationService) {
    /*Check thread owner team*/
    $scope.isOwnerTeam=false;
    if (_.findIndex($rootScope.currentTeam.leader, function(leader) {
        return leader._id.toString()===thread.owner._id.toString();
    }) !== -1 || _.findIndex($rootScope.currentTeam.member, function(member) {
        if (member._id && member.status=="Active") {
            return member._id._id.toString()===thread.owner._id.toString();
        }
    }) !== -1) {
        $scope.isOwnerTeam=true;
    }

    /*Update count total notifications*/
    $timeout(function() {
        $rootScope.$emit("UpdateCountNumber", {type: "message", number: (thread.__v>0)?1:0});
    }, 500);

    /*Update last access of current user*/
    messageService.lastAccess({id: $stateParams.messageId}).$promise.then(function(data) {
        $rootScope.$emit("Thread.Read", thread);
    });

    /*Mark as notifications related to thread as read after 3s
    and update unread activities list to false*/
    $timeout(function() {
        notificationService.markItemsAsRead({id: $stateParams.messageId}).$promise.then(function() {
            _.each($scope.thread.activities, function(a){
                a.unread = false;
                a.unreadLine=false;
            });
        });
    }, 3000);

    /*Filter unread activities depend on it's notifications length*/
    function filterUnreadActivites(thread) {
        if (thread.__v > 0) {
            var temp = 0;
            for (var i = thread.activities.length - 1; i >= 0; i--) {
                if (i===0) {
                    thread.activities[i].unreadLine=true;
                }
                thread.activities[i].unread = true;
                temp+=1;
                if (temp===thread.__v) {
                    break;
                }
            };
        }
    };

    $scope.thread = thread;

    filterUnreadActivites($scope.thread);

    $scope.people = people;
    $scope.thread.members.push(thread.owner);
    var allowMembers = angular.copy(thread.members);
    allowMembers.push(thread.owner);

    /*Initial thread detail*/
    function threadInitial() {
        restriction(allowMembers);
        $rootScope.title = thread.name;
        $rootScope.currentUser.isLeader = (_.findIndex($rootScope.currentTeam.leader, function(leader){return leader._id == $rootScope.currentUser._id}) !== -1) ? true: false;
        getProjectMembers();

        var prom = [];
        _.each($scope.thread.activities, function(item) {
            if (item.type === "related-task") {
                prom.push(taskService.get({id: item.element.item}).$promise);
            }
        });
        $q.all(prom).then(function(data) {
            _.each($scope.thread.activities, function(activity) {
                if (activity.type === "related-task" && activity.element.item && _.findIndex(data, function(task) {
                    return task._id.toString()===activity.element.item.toString();
                }) !== -1) {
                    var taskIndex = _.findIndex(data, function(task) {
                        return task._id.toString()===activity.element.item.toString();
                    });
                    activity.element.name = data[taskIndex].description;
                    activity.element.members = data[taskIndex].members;
                    _.each(data[taskIndex].notMembers, function(member) {
                        activity.element.members.push({email: member});
                    });
                }
            });
        });
    }

    threadInitial();

    socket.emit("join", $scope.thread._id);

    /*Receive when thread updated then mark notifications related to thread as read*/
    socket.on("thread:update", function(data) {
        $scope.thread = data;
        notificationService.markItemsAsRead({id: $stateParams.messageId}).$promise.then();
        threadInitial();
    });

    /*Receive when current user updated thread*/
    var clearThreadUpdate = $rootScope.$on("Thread.Update", function(event, data) {
        $scope.thread = data;
        threadInitial();
    });

    $scope.$on('$destroy', function() {
        clearThreadUpdate();
    });

    /*Check if current user is in thread members list or is the thread owner
    if not, redirect user to messages list
    */
    function restriction(members) {
        if (_.findIndex(members, function(member){
            return member._id.toString() === $rootScope.currentUser._id.toString();
        }) === -1) {
            $state.go("project.messages.all", {id: $scope.thread.project});
        }
    };

    /*Get project members list and file tags for create related file*/
    function getProjectMembers() {
        $scope.membersList = [];
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
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                        if (tender.tenderers[0]._id) {
                            tender.tenderers[0]._id.select = false;
                            $scope.membersList.push(tender.tenderers[0]._id);
                        } else {
                            $scope.membersList.push({email: tender.tenderers[0].email, select: false});
                        }
                    } else {
                        _.each(tender.tenderers, function(tenderer) {
                            if (tenderer._id._id.toString() === $rootScope.currentUser._id.toString()) {
                                _.each(tenderer.teamMember, function(member) {
                                    member.select = false;
                                    $scope.membersList.push(member);
                                });
                            }
                        });
                    }
                }
            });
        });
        // get unique member 
        $scope.membersList = _.uniq($scope.membersList, "_id");

        // filter members list again
        _.each(thread.members, function(member) {
            _.remove($scope.membersList, {_id: member._id});
        });

        // remove current user from the members list
        _.remove($scope.membersList, {_id: $rootScope.currentUser._id});

        // get invitees for related item
        $scope.invitees = angular.copy($scope.thread.members);
        _.each($scope.thread.notMembers, function(member) {
            $scope.invitees.push({email: member});
        });
        $scope.invitees.push($scope.thread.owner);
        $scope.invitees = _.uniq($scope.invitees, "email");
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    /*Show toast information*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*Show modal with specific name*/
    $scope.showModal = function(name, $event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectMessagesDetailCtrl',
            resolve: {
                thread: ["$stateParams", "messageService", function($stateParams, messageService) {
                    return messageService.get({id: $stateParams.messageId}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-messages/detail/partials/' + name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Show reply modal*/
    $scope.showReplyModal = function($event) {
        $scope.message = {};
        $scope.showModal("reply-message-modal.html", $event);
    };

    /*Check message text is valid then submit to server
    if success, call mixpanel track current user has sent reply*/
    $scope.sendMessage = function() {
        if ($scope.message.text && $scope.message.text.trim() != '' && $scope.message.text.length > 0) {
            messageService.sendMessage({id: $scope.thread._id}, $scope.message).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Your Message Has Been Sent Successfully.");
				
				//Track Reply Sent
				mixpanel.identify($rootScope.currentUser._id);
				mixpanel.track("Reply Sent");
				
                $rootScope.$emit("Thread.Update", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        } else {
            $scope.showToast("There Has Been An Error...");
        }
    };

    /*Show edit thread detail modal*/
    $scope.showEditMessageModal = function($event) {
        $scope.showModal("edit-message-modal.html", $event);
    };

    /*Edit thread detail*/
    $scope.editMessage = function(form) {
        if (form.$valid) {
            $scope.thread.elementType = "edit-thread";
            $scope.update($scope.thread);
            // messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
            //     $scope.closeModal();
            //     $scope.showToast("Message Thread Has Been Updated.");
            //     $rootScope.$emit("Thread.Update", res);
            // }, function(err){$scope.showToast("There Has Been An Error...");});
        }
    };

    /*Copy the uniq message address*/
    $scope.copyMessageAddress = function(id) {
        clipboard.copyText(id+"@mg.buiilt.com.au");
        $scope.showToast("Email Address Copied To Your Clipboard...");
    };

    /*Show add project team member to thread*/
    $scope.showAssignTeamMemberModal = function($event) {
        $scope.showModal("assign-team-member.html", $event)
    };

    /*Select tags for create related file
    Select available project team members to add to current thread
    Select current thread members to be new members when add new related item*/
    $scope.selectMember = function(index, type) {
        if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        } else if (type === "tag") {
            $scope.tags[index].select = !$scope.tags[index].select;
        } else {
            $scope.invitees[index].select = !$scope.invitees[index].select;
        }
    };

    /*Update current thread*/
    $scope.update = function(thread) {
        messageService.update({id: thread._id}, thread).$promise.then(function(res) {
            $scope.closeModal();
            $rootScope.$emit("Thread.Update", res);
            if (thread.elementType === "assign") {
                $scope.showToast("Message Thread Has Been Assigned To " +res.name+ " Successfully.");
            } else if (thread.elementType === "edit-thread") {
                $scope.showToast("Message Thread Has Been Updated.");
            } else {
                $scope.showToast((res.isArchive) ? "This Message Was Archived Successfully" : "This Message Was Unarchived Successfully");
            }
        }, function(err) {$scope.showToast("There Has Been An Error...");});
    };

    /*Assign more project members to current thread*/
    $scope.assignMember = function() {
        $scope.thread.newMembers = _.filter($scope.membersList, {select: true});
        $scope.thread.elementType = "assign";
        if ($scope.thread.newMembers.length > 0) {
            $scope.update($scope.thread);
        } else {
            $scope.showToast("Please Select At Least 1 Team Member...");
            delete $scope.thread.newMembers;
            delete $scope.thread.elementType;
            return false;
        }
    };

    /*Show modal to create thread thread*/
    $scope.showCreateRelatedThread = function($event) {
        $scope.relatedThread = {};
        $scope.showModal("create-related-thread.html", $event);
    };

    /*Create related thread when have valid members*/
    $scope.createRelatedThread = function(form) {
        if (form.$valid) {
            $scope.relatedThread.members = _.filter($scope.invitees, {select: true});
            $scope.relatedThread.belongTo = $scope.thread._id;
            $scope.relatedThread.belongToType = "thread";
            $scope.relatedThread.type = "project-message";
            if ($scope.relatedThread.members.length > 0) {    
                messageService.create({id: $stateParams.id}, $scope.relatedThread).$promise.then(function(relatedThread) {
                    $scope.closeModal();
                    $scope.showToast("Create Related Thread Successfully!");
                    $state.go("project.messages.detail", {id: $stateParams.id, messageId: relatedThread._id});
                }, function(err) {$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                delete $scope.relatedThread.member;
                delete $scope.relatedThread.belongTo;
                delete $scope.relatedThread.type;
                delete $scope.relatedTask.belongToType;
                return false;
            }
        } else {
            $scope.showToast("Please check your input again!");
        }
    };

    /*Show create related task modal*/
    $scope.showCreateRelatedTask = function($event) {
        $scope.relatedTask = {
            dateEnd: new Date()
        };
        $scope.minDate = new Date();
        $scope.showModal("create-related-task.html", $event);
    };

    /*Create related task when have valid member*/
    $scope.createRelatedTask = function(form) {
        if (form.$valid) {
            $scope.relatedTask.members = _.filter($scope.invitees, {select: true});
            $scope.relatedTask.belongTo = $scope.thread._id;
            $scope.relatedTask.belongToType = "thread";
            $scope.relatedTask.type = "task-project";
            if ($scope.relatedTask.members.length > 0) {
                taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(res) {
                    $scope.closeModal();
                    $scope.showToast("Related Task Has Been Created Successfully.");
                    $scope.thread.relatedItem.push({type: "task", item: res});
                    // $state.go("project.tasks.detail", {id: $stateParams.id, taskId: relatedTask._id});
                }, function(err){$scope.showToast("There Has Been An Error...");});
            } else {
                $scope.showToast("Please Select At Least 1 Assignee...");
                delete $scope.relatedTask.members;
                delete $scope.relatedTask.belongTo;
                delete $scope.relatedTask.type;
                delete $scope.relatedTask.belongToType;

                return false;
            }
        } else {
            $scope.showToast("There Has Been An Error...");
        }
    };

    /*Show create related file modal*/
    $scope.showCreateRelatedFile = function($event) {
        $scope.showModal("create-related-file.html", $event);
    };

    $scope.relatedFile = {
        tags:[],
        belongTo: $scope.thread._id,
        belongToType: "thread",
        type: "file"
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
        $scope.relatedFile.file = file;
    };

    /*Create related file with valid tags, members*/
    $scope.createRelatedFile = function() {
        $scope.relatedFile.members = $scope.invitees;
        $scope.relatedFile.tags = _.filter($scope.tags, {select: true});
        if ($scope.relatedFile.tags.length == 0) {
            $scope.showToast("Please Select At Least 1 Tag...");
        } else if ($scope.relatedFile.members.length == 0) {
            $scope.showToast("Please Select At Least 1 Recipient...");
        } else { 
            $scope.relatedFile.type="file";
            uploadService.upload({id: $stateParams.id}, $scope.relatedFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Related File Has Been Uploaded Successfully.");
                $scope.thread.relatedItem.push({type: "file", item: res});
                // $state.go("project.files.detail", {id: res.project._id, fileId: res._id});
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    /*Archive or unarchive a thread*/
    $scope.archive = function() {
        var confirm = $mdDialog.confirm().title((!$scope.thread.isArchive) ? "Archive?" : "Unarchive?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            $scope.thread.elementType = (!$scope.thread.isArchive) ? "archive" : "unarchive";
            $scope.thread.isArchive = !$scope.thread.isArchive;
            $scope.update($scope.thread);
        }, function() {
        });
    };

    getProjectMembers();
});