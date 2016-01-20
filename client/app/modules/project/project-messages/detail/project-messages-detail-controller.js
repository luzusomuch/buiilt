angular.module('buiiltApp').controller('projectMessagesDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, messageService, $mdToast, $mdDialog, $state, thread, peopleService, taskService, uploadService, people) {
    $scope.error = {};
    $scope.thread = thread;
    $scope.people = people;
    function threadInitial() {
        $scope.thread.members.push(thread.owner);
        restriction($scope.thread.members);
        $scope.orginalActivities = angular.copy($scope.thread.activities);
        _.remove($scope.thread.members, {_id: $rootScope.currentUser._id});
        $rootScope.title = thread.name;
        $rootScope.currentUser.isLeader = (_.findIndex($rootScope.currentTeam.leader, function(leader){return leader._id == $rootScope.currentUser._id}) !== -1) ? true: false;
        $scope.showRelatedAction = true;
        getProjectMembers($stateParams.id);
    }

    threadInitial();

    $rootScope.$on("Thread.Update", function(event, data) {
        $scope.thread = data;
        threadInitial();
    });

    $scope.chipsFilter = function(){
        $scope.showRelatedAction = !$scope.showRelatedAction;
    };

    $scope.$watch("showRelatedAction", function(value) {
        var activities = [];
        if (!value) {
            _.each($scope.orginalActivities, function(activity) {
                if (activity.type === "chat" || activity.type === "edit-thread" || activity.type === "assign") {
                    activities.push(activity);
                }
            });
            $scope.thread.activities = activities;
        } else {
            $scope.thread.activities = $scope.orginalActivities;
        }
    });

    function restriction(members) {
        if (_.findIndex(members, function(member){return member._id.toString() === $rootScope.currentUser._id.toString();}) === -1) {
            $state.go("project.messages.all", {id: $scope.thread.project});
        }
    };

    function getProjectMembers(id) {
        $scope.membersList = [];
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
        $scope.invitees = $scope.thread.members;
        $scope.invitees.push($scope.thread.owner);
        _.remove($scope.invitees, {_id: $rootScope.currentUser._id});
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showModal = function(name, $event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectMessagesDetailCtrl',
            resolve: {
                thread: function($stateParams, messageService) {
                    return messageService.get({id: $stateParams.messageId}).$promise;
                },
                people: function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-messages/detail/partials/' + name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.showReplyModal = function($event) {
        $scope.message = {};
        $scope.showModal("reply-message-modal.html", $event);
    };

    $scope.sendMessage = function() {
        if ($scope.message.text && $scope.message.text != ' ' && $scope.message.text.length > 0) {
            messageService.sendMessage({id: $scope.thread._id}, $scope.message).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Send message successfully!");
            }, function(err) {$scope.showToast("Error");});
        } else {
            $scope.showToast("Please check your message again!");
        }
    };

    $scope.showEditMessageModal = function($event) {
        $scope.showModal("edit-message-modal.html", $event);
    };

    $scope.editMessage = function(form) {
        if (form.$valid) {
            $scope.thread.updateInfo = true;
            messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Update message successfully!");
                $scope.thread.name = res.name;
            }, function(err){$scope.showToast("Error");});
        }
    };

    $scope.copySuccess = function() {
        $scope.showToast("Copy message thread successfully!");
    };

    $scope.copyError = function() {
        $scope.showToast("Copy message error");
    };

    $scope.showAssignTeamMemberModal = function($event) {
        $scope.showModal("assign-team-member.html", $event)
    };

    $scope.selectMember = function(index, type) {
        if (type === "member") {
            $scope.membersList[index].select = !$scope.membersList[index].select;
        } else {
            $scope.invitees[index].select = !$scope.invitees[index].select;
        }
    };

    $scope.assignMember = function() {
        $scope.thread.newMembers = _.filter($scope.membersList, {select: true});
        $scope.thread.elementType = "assign";
        if ($scope.thread.newMembers.length > 0) {
            messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Assign user to " +res.name+ " successfully!");
                $rootScope.$broadcast("Thread.Update", res);
            }, function(err){$scope.showToast("Something went wrong");});
        } else {
            $scope.showToast("Please select at least 1 member");
            delete $scope.thread.newMembers;
            delete $scope.thread.elementType;
            return false;
        }
    };

    $scope.showCreateRelatedThread = function($event) {
        $scope.relatedThread = {};
        $scope.showModal("create-related-thread.html", $event);
    };

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

    $scope.showCreateRelatedTask = function($event) {
        $scope.relatedTask = {
            dateEnd: new Date()
        };
        $scope.minDate = new Date();
        $scope.showModal("create-related-task.html", $event);
    };

    $scope.createRelatedTask = function(form) {
        if (form.$valid) {
            $scope.relatedTask.members = _.filter($scope.invitees, {select: true});
            $scope.relatedTask.belongTo = $scope.thread._id;
            $scope.relatedTask.belongToType = "thread";
            $scope.relatedTask.type = "task-project";
            if ($scope.relatedTask.members.length > 0) {
                taskService.create({id: $stateParams.id}, $scope.relatedTask).$promise.then(function(relatedTask) {
                    $scope.closeModal();
                    $scope.showToast("Create new related task successfully!");
                    $state.go("project.tasks.detail", {id: $stateParams.id, taskId: relatedTask._id});
                }, function(err){$scope.showToast("Error");});
            } else {
                $scope.showToast("Please select at least 1 invitee");
                delete $scope.relatedTask.members;
                delete $scope.relatedTask.belongTo;
                delete $scope.relatedTask.type;
                delete $scope.relatedTask.belongToType;

                return false;
            }
        } else {
            $scope.showToast("Please check your input again!");
        }
    };

    $scope.showCreateRelatedFile = function($event) {
        $scope.showModal("create-related-file.html", $event);
    };

    $scope.setRelatedFile = function() {
        $scope.relatedFile = {
            files:[],
            tags:[],
            belongTo: $scope.thread._id,
            belongToType: "thread"
        };
    }
    $scope.setRelatedFile();

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
        $scope.relatedFile.files.push(file);
    };

    $scope.createRelatedFile = function() {
        $scope.relatedFile.members = _.filter($scope.invitees, {select: true});
        if ($scope.relatedFile.files.length == 0) {
            $scope.showToast("Please choose at least 1 file");
        } else if ($scope.relatedFile.tags.length == 0) {
            $scope.showToast("Please enter at least 1 tags");
        } else if ($scope.relatedFile.members.length == 0) {
            $scope.showToast("Please choose at least 1 member");
        } else { 
            uploadService.upload({id: $stateParams.id}, $scope.relatedFile).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Upload new related file successfully");
                $scope.setRelatedFile();
                $state.go("project.files.detail", {id: res[0].project, fileId: res[0]._id});
            }, function(err) {$scope.showToast("Error");});
        }
    };

    getProjectMembers($stateParams.id);
});