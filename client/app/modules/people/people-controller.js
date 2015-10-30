angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, currentUser, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService, taskService, peopleChatService, authService, socket, notificationService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;  
    $scope.selectedUser = {};
    $scope.accordian = 1;

    function getAvailableUser(invitePeople) {
        $scope.currentUser.hasSelect = false;
        $scope.availableUserType = [];
        $scope.currentTeamMembers = [];
        $scope.available = [];
        // _.each($scope.team.leader, function(leader){
        //     $scope.currentTeamMembers.push(leader);
        //     $scope.available.push(leader);
        // });
        // _.each($scope.team.member, function(member){
        //     if (member._id && member.status == 'Active') {
        //         $scope.available.push(member._id);
        //         $scope.currentTeamMembers.push(member._id);
        //     }
        // });
        // $scope.currentTeamMembers = _.uniq($scope.currentTeamMembers, '_id');
        // authService.getCurrentUser().$promise.then(function(res){
        //     _.remove($scope.currentTeamMembers, {_id: res._id});
        // });
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
            _.each(invitePeople.builders, function(builder) {
                if (builder._id) {
                    $scope.currentTeamMembers.push(builder._id);
                }
            });
        } else if (_.findIndex(invitePeople.architects, function(item) {
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'architect';
            _.each(invitePeople.architects, function(architect) {
                if (architect._id) {
                    $scope.currentTeamMembers.push(architect._id);
                }
            });
        } else if (_.findIndex(invitePeople.clients, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'client';
            _.each(invitePeople.clients, function(client) {
                if (client._id) {
                    $scope.currentTeamMembers.push(client._id);
                }
            });
        } else if (_.findIndex(invitePeople.subcontractors, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'subcontractor';
            _.each(invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id) {
                    $scope.currentTeamMembers.push(subcontractor._id);
                }
            });
        } else if (_.findIndex(invitePeople.consultants, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'consultant';
            _.each(invitePeople.consultants, function(consultant) {
                if (consultant._id) {
                    $scope.currentTeamMembers.push(consultant._id);
                }
            });
        } else {
            $scope.currentUser.type = 'default';
        }

        if ($scope.builderPackage.projectManager.type == 'architect') {
            if ($scope.builderPackage.ownerType == 'homeOwner') {
                invitePeople.clients.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'client';
                }
            } else if ($scope.builderPackage.ownerType == 'builder') {
                invitePeople.builders.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'builder';
                }
            }
            invitePeople.architects.push({_id: $scope.builderPackage.projectManager._id});
            if ($scope.builderPackage.projectManager._id._id == $scope.currentUser._id) {
                $scope.currentUser.type = 'architect';
                $scope.currentUser.hasSelect = true;
                $scope.availableUserType = [
                    {value: 'addTeamMember', text: 'team'}, 
                    {value: 'addClient', text: 'client'}, 
                    {value: 'addBuilder', text: 'builder'}, 
                    {value: 'addConsultant', text: 'consultant'}
                ];
            } else {
                switch ($scope.currentUser.type) {
                    case 'client': 
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addSubcontractor', text: 'subcontractor'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addClient', text: 'client'}, 
                            {value: 'addBuilder', text: 'builder'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    default: 
                        break;
                }
            }
        } else if ($scope.builderPackage.projectManager.type == 'builder') {
            if ($scope.builderPackage.ownerType == 'homeOwner') {
                invitePeople.clients.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'client';
                }
            } else if ($scope.builderPackage.ownerType == 'architect') {
                invitePeople.architects.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'architect';
                }
            }
            invitePeople.builders.push({_id: $scope.builderPackage.projectManager._id});
            if ($scope.builderPackage.projectManager._id._id == $scope.currentUser._id) {
                $scope.currentUser.type = 'builder';
                $scope.currentUser.hasSelect = true;
                $scope.availableUserType = [
                    {value: 'addTeamMember', text: 'team'}, 
                    {value: 'addClient', text: 'client'}, 
                    {value: 'addArchitect', text: 'architect'}, 
                    {value: 'addSubcontractor', text: 'subcontractor'}, 
                    {value: 'addConsultant', text: 'consultant'}
                ];
            } else {
                switch ($scope.currentUser.type) {
                    case 'client': 
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addClient', text: 'client'}, 
                            {value: 'addArchitect', text: 'architect'}, 
                            {value: 'addSubcontractor', text: 'subcontractor'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    default: 
                        break;
                }
            }
        } else {
            if ($scope.builderPackage.ownerType == 'builder') {
                invitePeople.builders.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'builder';
                }
            } else if ($scope.builderPackage.ownerType == 'architect') {
                invitePeople.architects.push({_id: $scope.builderPackage.owner});
                if ($scope.builderPackage.owner._id == $scope.currentUser._id) {
                    $scope.currentUser.type = 'architect';
                }
            }
            invitePeople.clients.push({_id: $scope.builderPackage.projectManager._id});
            if ($scope.builderPackage.projectManager._id._id == $scope.currentUser._id) {
                $scope.currentUser.type = 'client';
                $scope.currentUser.hasSelect = true;
                $scope.availableUserType = [
                    {value: 'addTeamMember', text: 'team'}, 
                    {value: 'addBuilder', text: 'builder'}, 
                    {value: 'addArchitect', text: 'architect'}, 
                    {value: 'addConsultant', text: 'consultant'}
                ];
            } else {
                switch ($scope.currentUser.type) {
                    case 'client': 
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addBuilder', text: 'builder'}, 
                            {value: 'addArchitect', text: 'architect'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'builder':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addSubcontractor', text: 'subcontractor'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'architect':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}, 
                            {value: 'addConsultant', text: 'consultant'}
                        ];
                        break;
                    case 'subcontractor':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    case 'consultant':
                        $scope.availableUserType = [
                            {value: 'addTeamMember', text: 'team'}
                        ];
                        break;
                    default: 
                        break;
                }
            }
        }

        if ($scope.currentUser.type == 'builder') {
            _.each(invitePeople.builders, function(builder) {
                if (builder._id) {
                    if (builder._id._id == $scope.currentUser._id && builder.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        } else if ($scope.currentUser.type == 'client') {
            _.each(invitePeople.clients, function(client) {
                if (client._id) {
                    if (client._id._id == $scope.currentUser._id && client.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        } else if ($scope.currentUser.type == 'architect') {
            _.each(invitePeople.architects, function(architect) {
                if (architect._id) {
                    if (architect._id._id == $scope.currentUser._id && architect.hasSelect) {
                        $scope.currentUser.hasSelect = true;
                    }
                }
            });
        }
    };

    socket.on('onlineUser', function(users) {
        var onlineUsersList = [];
        _.each(users, function(user) {
            var index = _.findIndex($scope.available, function(item) {
                return item._id == user;
            });
            if (index != -1) {
                onlineUsersList.push(index);
            }
        });
        _.each(onlineUsersList, function(user) {
            $scope.available[user].isOnline = true;
        });
    });

    function getTaskAndDocumentBySelectedUser(user) {
        taskService.getByPackage({id: $scope.invitePeople._id, type: 'people'}).$promise.then(function(res){
            $scope.tasks = res;
            _.each($scope.tasks, function(task){
                task.isOwner = false;
                _.each(task.assignees, function(assignee){
                    if (assignee._id == user._id) {
                        task.isOwner = true;
                    }
                });
            });
        });
        fileService.getFileInPeople({id: $stateParams.id}).$promise.then(function(res){
            $scope.files = res;
            _.each($scope.files, function(file) {
                file.isOwner = false;
                _.each(file.usersRelatedTo, function(userRelated) {
                    if (userRelated == user._id) {
                        file.isOwner = true;
                    }
                });
            });
        });
    };

    $scope.getTenderListByType = function(type) {
        $scope.selectedTeamType = type;
        $scope.tendersList = [];
        if (type == 'subcontractor') {
            _.each($scope.invitePeople.subcontractors, function(subcontractor) {
                if (subcontractor._id && subcontractor.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: subcontractor, type: 'subcontractor'});
                }
            });
        } else if (type == 'builder') {
            _.each($scope.invitePeople.builders, function(builder) {
                if (builder._id && builder.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: builder, type: 'builder'});
                }
            });
        } else if (type == 'client') {
            _.each($scope.invitePeople.clients, function(client) {
                if (client._id && client.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: client, type: 'client'});
                }
            });
        } else if (type == 'architect') {
            _.each($scope.invitePeople.architects, function(architect) {
                if (architect._id && architect.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: architect, type: 'architect'});
                }
            });
        } else if (type == 'consultant') {
            _.each($scope.invitePeople.consultants, function(consultant) {
                if (consultant._id && consultant.inviter == $scope.currentUser._id) {
                    $scope.tendersList.push({tender: consultant, type: 'consultant'});
                }
            });
        }
    };

    $scope.selectWinnerTender = function(tender) {
        peopleService.selectWinnerTender({id: $stateParams.id}, tender).$promise.then(function(res) {
            $scope.invitePeople = res;
            getAvailableUser(res);
            $("#view_tender_detail").closeModal();
        }, function(err) {
            console.log(err);
        });
    };

    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
        $scope.invitePeople = res;
        getAvailableUser($scope.invitePeople);
    });

    $scope.invite = {
        invitees: []
    };

    $scope.addInvitee = function(invitee) {
        if (invitee && invitee != '') {
            $scope.invite.invitees.push({email: invitee});
            $scope.invite.email = null;
        }
    };
    $scope.removeInvitee = function(index) {
        $scope.invite.invitees.splice(index, 1);
    };

    $scope.inviteMorePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            if ($scope.invite.type == 'addTeamMember') {
                teamService.addMember({id: $scope.team._id},$scope.invite.invitees).$promise
                .then(function(team) {
                    $scope.team = team;
                    getAvailableUser($scope.invitePeople);
                    $rootScope.$emit('TeamUpdate',team);
                    $scope.invite.invitees = [];
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
        $scope.uploadFile.assignees = [$scope.selectedUser._id, $scope.currentUser._id];
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
            var currentUser = {
                _id: $scope.currentUser._id
            };
            $scope.task.assignees = [$scope.selectedUser, currentUser];
            // $scope.task.assignees.push($scope.selectedUser);
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
        getTaskAndDocumentBySelectedUser(user);

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
                                $timeout(function(){
                                    notificationService.markAsRead({_id: message._id}).$promise.then(function(res){
                                        $rootScope.$broadcast("notification:read", res);
                                    });
                                    $scope.selectedChatPeople.hasUnreadMessage = false;
                                    _.each($scope.selectedChatPeople.messages, function(message){
                                        message.unread = false;
                                    });
                                }, 2000);
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
        } else if (($event.keyCode === 32 || $event.keyCode === 8) && $scope.showPopup) {
            $scope.showPopup = false;
        }
    };

    $scope.message = {};

    $scope.showPopup = false;

    $scope.getMentionValue = function(mention) {
        $scope.message.text = $scope.message.text.substring(0, $scope.message.text.length -1);
        $scope.message.text += mention.name;  
        $scope.showPopup = false;
    };

    $scope.$watch('message.text', function(newValue, oldValue) {
        $scope.mentionPeople = [];
        if (newValue) {
            if (newValue.slice(-1) == "@") {
                $scope.showPopup = true;   
            }
        }
    });

    $scope.sendMessage = function() {
        peopleChatService.sendMessage({id: $scope.selectedChatPeople._id}, $scope.message).$promise.then(function(res) {
            $scope.selectedChatPeople = res;
            $scope.message.text = null;
        }, function(err){
            console.log(err);
        });
    };
});