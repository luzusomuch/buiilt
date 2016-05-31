angular.module('buiiltApp').controller('projectMessagesDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, messageService, $mdToast, $mdDialog, $state, thread, peopleService, taskService, uploadService, people, clipboard, socket, notificationService, tenders, activities, dialogService) {
    $scope.contentHeight = $rootScope.maximunHeight - $("header").innerHeight() - 10;

    $scope.showDetail = false;
	
	/*Close opening modal*/
    $scope.closeModal = function() {
        if ($rootScope.firstTimeEdit)
            $scope.removeThread();
        else 
            dialogService.closeModal();
    };

    /*Show modal with specific name*/
    $scope.showModal = function(name, $event) {
        $mdDialog.show({
            // targetEvent: $event,
            controller: 'projectMessagesDetailCtrl',
            resolve: {
                thread: ["$stateParams", "messageService", function($stateParams, messageService) {
                    return messageService.get({id: $stateParams.messageId}).$promise;
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.getAll({id: $stateParams.id}).$promise;
                }],
                activities:["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }],
            },
            templateUrl: 'app/modules/project/project-messages/detail/partials/' + name,
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            escapeToClose: false
        });
    };

    // dynamic height for related file thumbnail
    $scope.imageHeight = $("div.content").innerHeight() - $("div.content").innerHeight() * 0.2;

    var originalThread = angular.copy(thread);
    // $scope.showDetail = ($rootScope.openDetail) ? true : false;

    // If current thread just created then show edit modal
    if ($rootScope.openDetail) {
        $rootScope.firstTimeEdit = true;
        $rootScope.openDetail = null;
        $scope.showModal("edit-message-modal.html", null);
    }

    $scope.showSaveTitleBtn = false;
    $scope.$watch("thread.name", function(value) {
        if (originalThread.name !== value) {
            $scope.showSaveTitleBtn = true;
        }
    });

    $scope.activities = activities;
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
    // $timeout(function() {
    //     $rootScope.$emit("UpdateCountNumber", {type: "message", number: (thread.__v>0)?1:0});
    // }, 500);

    /*Update last access of current user*/
    messageService.lastAccess({id: $stateParams.messageId}).$promise.then(function(data) {
        $rootScope.$emit("Thread.Read", thread);
    });

    socket.on("dashboard:new", function(data) {
        if (data.type==="thread" && data.thread._id.toString()===thread._id.toString()) {
            $rootScope.$emit("Thread.Read", data.thread);
        }
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
    $scope.elementType=(!thread.event) ? "add-event" : null;
    $scope.thread.selectedEvent = thread.event;

    filterUnreadActivites($scope.thread);

    $scope.people = people;
    if (_.filter($scope.thread.members, function(member) {
        return member._id.toString()===$scope.thread.owner._id.toString();
    }) === -1) {
        $scope.thread.members.push(thread.owner);
    }
    var allowMembers = angular.copy(thread.members);
    allowMembers.push(thread.owner);

    /*Initial thread detail*/
    function threadInitial() {
        restriction(allowMembers);
        $rootScope.title = thread.name;
        $rootScope.currentUser.isLeader = (_.findIndex($rootScope.currentTeam.leader, function(leader){return leader._id == $rootScope.currentUser._id}) !== -1) ? true: false;

        var prom = [];
        _.each($scope.thread.activities, function(item) {
            if (item.type === "related-task") {
                prom.push(taskService.get({id: item.element.item}).$promise);
            }
        });
        $q.all(prom).then(function(data) {
            _.each($scope.thread.activities, function(activity) {
                if (activity.type === "related-task" && activity.element.item) {
                    var index = _.findIndex(data, function(task) {
                        return task._id.toString()===activity.element.item.toString();
                    });
                    if (index !== -1) {
                        activity.element.name = data[index].description;
                        activity.element.members = data[index].members;
                        _.each(data[index].notMembers, function(member) {
                            activity.element.members.push({email: member});
                        });
                    }
                } else if (activity.type==="related-file" && activity.element.item) {
                    var index = _.findIndex($scope.thread.relatedItem, function(item) {
                        return item.item._id.toString()===activity.element.item.toString();
                    });
                    if (index !== -1) {
                        activity.element.path = $scope.thread.relatedItem[index].item.path;
                    }
                }
            });
        });
    }

    threadInitial();

    socket.emit("join", $scope.thread._id);

    // Add get related item for current thread
    socket.on("relatedItem:new", function(data) {
        if (data.belongTo.toString()===thread._id.toString()) {
            $scope.thread.relatedItem.push({type: data.type, item: data.data});
            $scope.thread.activities.push({
                user: {_id: data.excuteUser._id, name: data.excuteUser.name, email: data.excuteUser.email},
                type: "related-"+data.type,
                element: {item: data.data._id, path: (data.data.path) ? data.data.path : null, name: (data.data.name) ? data.data.name : data.data.description, related: true}
            });
        }
    });

    /*Receive when thread updated then mark notifications related to thread as read*/
    socket.on("thread:update", function(data) {
        originalThread = data;
        $scope.thread = data;
        $scope.thread.selectedEvent = data.event;
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
    function getProjectMembersOrTenderers() {
        $scope.tender = tenders[0];
        $scope.membersList = [];
        $scope.tags = [];
        _.each($rootScope.currentTeam.fileTags, function(tag) {
            $scope.tags.push({name: tag, select: false});
        });
        if (!$scope.tender || $scope.tender.owner._id==$rootScope.currentUser._id) {
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
        } else {
            $scope.membersList.push(people[$scope.tender.ownerType][0].tenderers[0]._id);
            _.each(people[$scope.tender.ownerType][0].tenderers[0].teamMember, function(member) {
                $scope.membersList.push(member);
            });
            var currentTenderIndex = _.findIndex($scope.tender.members, function(member) {
                if (member.user) {
                    return member.user._id==$rootScope.currentUser._id;
                }
            });
            if (currentTenderIndex !== -1) {
                $scope.membersList.push($scope.tender.members[currentTenderIndex].user);
                if ($scope.tender.members[currentTenderIndex].teamMember) {
                    _.each($scope.tender.members[currentTenderIndex].teamMember, function(member) {
                        $scope.membersList.push(member);
                    });
                }
            } else {
                _.each($scope.tender.members, function(member) {
                    var memberIndex = _.findIndex(member.teamMember, function(teamMember) {
                        return teamMember._id.toString() === $rootScope.currentUser._id.toString();
                    });
                    if (memberIndex !== -1) {
                        _.each(member.teamMember, function(teamMember) {
                            $scope.membersList.push(teamMember);
                        });
                        $scope.membersList.push(member.user);
                    }
                });
            }            
        }
        // filter members list again
        _.each(thread.members, function(member) {
            _.remove($scope.membersList, {_id: member._id});
        });
        _.each(thread.notMembers, function(email) {
            _.remove($scope.membersList, {email: email});
        })

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

    getProjectMembersOrTenderers();

    /*Show toast information*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
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
                $scope.message.text = null;
                $timeout(function() {
                    $("#messageArea").css({"height": "29px"});
                }, 1000);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        } else {
            $scope.showToast("There Has Been An Error...");
        }
    };

    /*Show edit thread detail modal*/
    $scope.showEditThreadModal = function($event) {
        $scope.showModal("edit-message-modal.html", $event);
    };

    /*Edit thread detail*/
    $scope.editMessage = function(form) {
        if (form.$valid) {
            $scope.thread.newMembers = _.filter($scope.membersList, {select: true});
            if ($rootScope.firstTimeEdit && $scope.thread.newMembers.length===0) {
                return dialogService.showToast("Please Select At Least 1 Member");
            }
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
        if (thread.elementType==="assign" && thread.element.type==="tender") {
            return dialogService.showToast("Not Allow");
        }
        messageService.update({id: thread._id}, thread).$promise.then(function(res) {
            dialogService.closeModal();
            $rootScope.$emit("Thread.Update", res);
            if (thread.elementType === "assign") {
                dialogService.showToast("Message Thread Has Been Assigned To " +res.name+ " Successfully.");
            } else if (thread.elementType === "edit-thread") {
                dialogService.showToast("Message Thread Has Been Updated.");
                $scope.showSaveTitleBtn = false;
            } else if (thread.elementType==="add-event") {
                dialogService.showToast("Add Event To Message Thread Successfully");
                $scope.elementType = null;
            } else if (thread.elementType==="change-event") {
                dialogService.showToast("Change Event Of This Message Thread Successfully");
            } else {
                dialogService.showToast((res.isArchive) ? "This Message Was Archived Successfully" : "This Message Was Unarchived Successfully");
            }
            // $scope.showDetail = false;
        }, function(err) {dialogService.showToast("There Has Been An Error...");});
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
            }
        } else {
            $scope.showToast("Please check your input again!");
        }
    };

    /*Show create related task modal*/
    $scope.relatedTask = {
        dateEnd: new Date(),
        dateStart: new Date(),
        time: {},
        selectedEvent: $scope.thread.event,
    };
    $scope.showCreateRelatedTask = function($event) {
        $scope.minDate = new Date();
        $scope.showModal("create-related-task.html", $event);
    };

    /*Create related task when have valid member*/
    $scope.createRelatedTask = function(form) {
        if ($scope.thread.element.type==="tender") {
            return dialogService.showToast("Not Allow");
        }
        if (form.$valid) {
            $scope.relatedTask.members = $scope.thread.members;
            _.each($scope.thread.notMembers, function(email) {
                $scope.relatedTask.members.push({email: email});
            });
            $scope.relatedTask.belongTo = $scope.thread._id;
            $scope.relatedTask.belongToType = "thread";
            $scope.relatedTask.type = "task-project";
            if (!$scope.relatedTask.time.start || !$scope.relatedTask.time.end || !$scope.relatedTask.dateEnd) {
                dialogService.showToast("Please Check Your Date Time");
                return;
            }
            if ($scope.relatedTask.members.length > 0) {
                taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(res) {
                    $scope.closeModal();
                    dialogService.showToast("Related Task Has Been Created Successfully.");
                }, function(err){dialogService.showToast("There Has Been An Error...");});
            } else {
                dialogService.showToast("Please Select At Least 1 Assignee...");
                return false;
            }
        } else {
            dialogService.showToast("There Has Been An Error...");
        }
    };

    // Create related file
    $scope.relatedFile = {
        belongTo: thread._id,
        belongToType: "thread",
        type: "file",
        selectedEvent: thread.event
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.relatedFile.file = file;
    };

    /*Create related file with valid tags, members*/
    $scope.createRelatedFile = function() {
        if ($scope.thread.element.type==="tender") {
            return dialogService.showToast("Not Allow");
        }
        $scope.relatedFile.members = $scope.thread.members;
        _.each($scope.thread.notMembers, function(email) {
            $scope.relatedFile.members.push({email: email});
        });
        if (!$scope.relatedFile.selectedTag) {
            dialogService.showToast("Please Select At Least 1 Tag...");
        } else { 
            uploadService.upload({id: $stateParams.id}, $scope.relatedFile).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Related File Has Been Uploaded Successfully.");
            }, function(err) {
                dialogService.showToast("There Has Been An Error...");
            });
        }
    };
    // End Create Related File

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

    $scope.step=1;
    $scope.next = function(type) {
        if ($scope.step==1) {
            if (type==="create-related-task" && !$scope.relatedTask.description) {
                dialogService.showToast("Check Your Input Again.");
            } else if (type==="edit-thread" && !$scope.thread.name) {
                dialogService.showToast("Check Your Input Again.");
            } else {
                $scope.step += 1;
            }
        }
    };

    $scope.addOrChangeEvent = function() {
        if (!$scope.thread.selectedEvent) {
            dialogService.showToast("Please Select An Event");
        } else {
            $scope.thread.elementType = ($scope.elementType) ? $scope.elementType : "change-event";
            $scope.update($scope.thread);
        }
    };

    $scope.changeTitle = function(form) {
        if (form.$valid && $scope.thread.name!==originalThread.name) {
            $scope.thread.elementType="edit-thread";
            $scope.update($scope.thread);
        } else {
            dialogService.showToast("Check Your Data");
        }
    };

    // Remove thread when click cancel if its the first time edit
    $scope.removeThread = function() {
        messageService.delete({id: thread._id}).$promise.then(function() {
            dialogService.closeModal();
            dialogService.showToast("Thread Has Been Removed");
            $rootScope.$emit("Thread.Remove", thread._id);
            $state.go("project.messages.all", {id: $stateParams.id});
        }, function(error) {
            dialogService.showToast("Error When Delete");
        });
    };
});