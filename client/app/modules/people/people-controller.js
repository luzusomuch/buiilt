angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, currentUser, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService, taskService, peopleChatService, authService, socket, notificationService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;  
    $scope.selectedUser = {};
    $scope.accordian = 1;

    function getAvailableUser(invitePeople) {
        $scope.currentTeamMembers = [];
        $scope.available = [];
        _.each($scope.team.leader, function(leader){
            $scope.currentTeamMembers.push(leader);
            $scope.available.push(leader);
        });
        _.each($scope.team.member, function(member){
            if (member._id && member.status == 'Active') {
                $scope.available.push(member._id);
                $scope.currentTeamMembers.push(member._id);
            }
        });
        $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
        authService.getCurrentUser().$promise.then(function(res){
            _.remove($scope.currentTeamMembers, {_id: res._id});
        });
        _.each(invitePeople.builders, function(builder){
            if (builder._id) {
                $scope.available.push(builder._id);
            }
        });
        _.each(invitePeople.architects, function(architect){
            if (architect._id) {
                $scope.available.push(architect._id);
            }
        });
        _.each(invitePeople.clients, function(client){
            if (client._id) {
                $scope.available.push(client._id);
            }
        });
        _.each(invitePeople.subcontractors, function(subcontractor){
            if (subcontractor._id) {
                $scope.available.push(subcontractor._id);
            }
        });
        _.each(invitePeople.consultants, function(consultant){
            if (consultant._id) {
                $scope.available.push(consultant._id);
            }
        });
        $scope.available = _.uniq($scope.available, '_id');
        if ($scope.available.length > 1) {
            $scope.selectUser($scope.available[1], '');
        }

        if (_.findIndex(invitePeople.builders, function(item) {
            if (item._id) {
                return item._id._id == $scope.currentUser._id;
            }}) != -1) {
            $scope.currentUser.type = 'builder';
        } else if (_.findIndex(invitePeople.architects, function(item) {
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'architect';
        } else if (_.findIndex(invitePeople.clients, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'client';
        } else if (_.findIndex(invitePeople.subcontractors, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'subcontractor';
        } else if (_.findIndex(invitePeople.consultants, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'consultant';
        } else {
            $scope.currentUser.type = 'default';
        }
        console.log($scope.builderPackage);
        if ($scope.builderPackage.projectManager.type == 'architect') {

        } else if ($scope.builderPackage.projectManager.type == 'builder') {

        } else {
            
        }
    };

    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
        $scope.invitePeople = res;
        getAvailableUser($scope.invitePeople);
        taskService.getByPackage({id: res._id, type: 'people'}).$promise.then(function(res){
            $scope.tasks = res;
            _.each($scope.tasks, function(task){
                task.isOwner = false;
                _.each(task.assignees, function(assignee){
                    if (assignee._id == $scope.currentUser._id) {
                        task.isOwner = true;
                    }
                });
            });
        });
    });

    $scope.invite = {};
    $scope.inviteMorePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            if ($scope.invite.type == 'addTeamMember') {
                var emails = [];
                emails.push({email:$scope.invite.email});
                teamService.addMember({id: $scope.team._id},emails).$promise
                .then(function(team) {
                    $scope.team = team;
                    getAvailableUser($scope.invitePeople);
                    $rootScope.$emit('TeamUpdate',team);
                    $scope.invite = {};
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(err){
                    console.log(err);
                });
            } else {
                peopleService.update({id: $stateParams.id},$scope.invite).$promise.then(function(res){
                    $scope.invitePeople = res;
                    getAvailableUser($scope.invitePeople);
                    $scope.invite = {};
                    $scope.submitted = false;
                    $("#tender_modal").closeModal();
                }, function(res){
                    console.log(res);
                });
            }
        }
    };

    fileService.getFileInPeople({id: $stateParams.id}).$promise.then(function(res){
        $scope.files = res;
        _.each($scope.files, function(file) {
            file.isOwner = false;
            _.each(file.usersRelatedTo, function(user) {
                if (user == $scope.currentUser._id) {
                    file.isOwner = true;
                }
            });
        });
    });

    $scope.uploadFile = {
        assignees : []
    };
    $scope.selectedTags = [];
    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            {mimetype: 'image/*'},
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadFile = {
            file: file,
            _id: ($scope.fileId) ? $scope.fileId : '',
            belongToType: 'people',
            tags: $scope.selectedTags,
            isQuote: $scope.isQuote,
            assignees : []
        };
        $scope.uploadFile.assignees.push($scope.selectedUser._id);
    };

    $scope.uploadNewAttachment = function() {
        uploadService.uploadInPeople({id: $stateParams.id, file: $scope.uploadFile}).$promise.then(function(res){
            $('#new_attachment').closeModal();
            $state.reload();
        });
    };

    $scope.task = {
        assignees : []
    };

    $scope.addNewTask = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            $scope.task.assignees.push($scope.selectedUser);
            $timeout(function(){
                taskService.create({id: $scope.invitePeople._id, type: 'people'},$scope.task).$promise.then(function(res){
                    res.isOwner = false;
                    _.each(res.assignees, function(assignee){
                        if (assignee._id == $scope.currentUser._id) {
                            res.isOwner = true;
                        }
                    });
                    $scope.tasks.push(res);
                    $("#new_task").closeModal();
                    $scope.task = {
                        assignees : []
                    };
                    getAvailableUser($scope.invitePeople);
                    $scope.submitted = false;
                }, function(res){
                    console.log(res);
                });
            },500);
        }
    };

    $scope.selectUser = function(user, type) {
        $scope.selectedUser = user;
        $scope.selectedUser.type = type;

        peopleChatService.selectPeople(
            {id: $scope.invitePeople._id},
            {project: $stateParams.id, user: user._id}
        ).$promise.then(function(res){
            socket.emit('join',res._id);
            $scope.selectedChatPeople = res;
            $scope.unreadMessages = $rootScope.unreadMessages;
            var unreadMessagesNumber = 0;
            var temp = 0;
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == $scope.selectedChatPeople._id && message.referenceTo == "people-chat") {
                    unreadMessagesNumber++;
                }
            });
            _.each($scope.unreadMessages, function(message){
                if (message.element._id == $scope.selectedChatPeople._id && message.referenceTo == "people-chat") {
                    $scope.selectedChatPeople.hasUnreadMessage = true;
                    for (var i = $scope.selectedChatPeople.messages.length - 1; i >= 0; i--) {
                        if ($scope.selectedChatPeople.messages[i].user._id != $scope.currentUser._id) {
                            $scope.selectedChatPeople.messages[i].unread = true;
                            temp += 1;
                        } else {
                            $scope.selectedChatPeople.messages[i].unread = false;
                        }
                        if (temp == unreadMessagesNumber) {
                            return false;
                        }
                    };
                } else {
                    $scope.selectedChatPeople.hasUnreadMessage = false;
                }
            });
            if ($scope.selectedChatPeople.hasUnreadMessage) {
                $("div#peopleChatContent").scroll(function() {
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                        _.each($scope.unreadMessages, function(message){
                            if (message.element._id == $scope.selectedChatPeople._id) {
                                notificationService.markAsRead({_id: message._id}).$promise.then(function(res){
                                    $rootScope.$broadcast("notification:read", res);
                                });
                                $scope.selectedChatPeople.hasUnreadMessage = false;
                                _.each($scope.selectedChatPeople.messages, function(message){
                                    message.unread = false;
                                });
                            }
                        });
                    }
                });
            }
        }, function(err){
            console.log(err);
        });
    };

    socket.on('peopleChat:new', function (peopleChat) {
        $scope.selectedChatPeople = peopleChat;
    });

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        }
    };

    $scope.message = {};
    $scope.sendMessage = function() {
        peopleChatService.sendMessage({id: $scope.selectedChatPeople._id}, $scope.message).$promise.then(function(res) {
            $scope.selectedChatPeople = res;
            $scope.message.text = null;
        }, function(err){
            console.log(err);
        });
    };
});