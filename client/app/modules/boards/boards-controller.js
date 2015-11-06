angular.module('buiiltApp')
.controller('BoardsCtrl', function ($scope, $rootScope, $state, team, currentUser, builderPackage, boardService, $stateParams, fileService, filepickerService, uploadService, taskService, socket, notificationService, peopleService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;

    function getAvailableAddedToNewBoard() {
        $scope.availableInvite = [];
        peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(board){
            if (_.findIndex(board.builders, function(item) {
                if (item._id) {
                    return item._id._id == $scope.currentUser._id;
                }}) != -1) {
                $scope.currentUser.type = 'builder';
            } else if (_.findIndex(board.architects, function(item) {
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'architect';
            } else if (_.findIndex(board.clients, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'client';
            } else if (_.findIndex(board.subcontractors, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'subcontractor';
            } else if (_.findIndex(board.consultants, function(item){
                if (item._id) {return item._id._id == $scope.currentUser._id;}
                }) != -1) {
                $scope.currentUser.type = 'consultant';
            } else {
                $scope.currentUser.type = 'default';
            }
            if ($scope.builderPackage.projectManager.type == 'architect') {
                if ($scope.currentUser.type == 'builder' || $scope.currentUser.type == 'client') {
                    _.each(board.architects, function(architect) {
                        if (architect._id && architect.hasSelect) {
                            $scope.availableInvite.push(architect._id);
                        }
                    });
                    _.each(board.consultants, function(consultant) {
                        if (consultant._id && consultant.hasSelect) {
                            $scope.availableInvite.push(consultant._id);
                        }
                    });
                    if ($scope.currentUser.type == 'builder') {
                        _.each(board.subcontractors, function(subcontractor) {
                            if (subcontractor._id && subcontractor.hasSelect) {
                                $scope.availableInvite.push(subcontractor._id);
                            }
                        });
                    }
                } else if ($scope.currentUser.type == 'architect') {
                    _.each(board.builders, function(builder) {
                        if (builder._id && builder.hasSelect) {
                            $scope.availableInvite.push(builder._id);
                        }
                    });
                    _.each(board.clients, function(client) {
                        if (client._id && client.hasSelect) {
                            $scope.availableInvite.push(client._id);
                        }
                    });
                    _.each(board.consultants, function(consultant) {
                        if (consultant._id && consultant.hasSelect) {
                            $scope.availableInvite.push(consultant._id);
                        }
                    });
                }
            } else if ($scope.builderPackage.projectManager.type == 'builder') {
                if ($scope.currentUser.type == 'builder') {
                    _.each(board.architects, function(architect) {
                        if (architect._id && architect.hasSelect) {
                            $scope.availableInvite.push(architect._id);
                        }
                    });
                    _.each(board.consultants, function(consultant) {
                        if (consultant._id && consultant.hasSelect) {
                            $scope.availableInvite.push(consultant._id);
                        }
                    });
                    _.each(board.subcontractors, function(subcontractor) {
                        if (subcontractor._id && subcontractor.hasSelect) {
                            $scope.availableInvite.push(subcontractor._id);
                        }
                    });
                    _.each(board.clients, function(client) {
                        if (client._id && client.hasSelect) {
                            $scope.availableInvite.push(client._id);
                        }
                    });
                } else if ($scope.currentUser.type == 'client' || $scope.currentUser.type == 'architect') {
                    _.each(board.builders, function(builder) {
                        if (builder._id && builder.hasSelect) {
                            $scope.availableInvite.push(builder._id);
                        }
                    });
                    _.each(board.consultants, function(consultant) {
                        if (consultant._id && consultant.hasSelect) {
                            $scope.availableInvite.push(consultant._id);
                        }
                    });
                } 
            } else {
                if ($scope.currentUser.type == 'client') {
                    _.each(board.builders, function(builder) {
                        if (builder._id && builder.hasSelect) {
                            $scope.availableInvite.push(builder._id);
                        }
                    });
                    _.each(board.architects, function(architect) {
                        if (architect._id && architect.hasSelect) {
                            $scope.availableInvite.push(architect._id);
                        }
                    });
                    _.each(board.consultants, function(consultant) {
                        if (consultant._id && consultant.hasSelect) {
                            $scope.availableInvite.push(consultant._id);
                        }
                    });
                } else if ($scope.currentUser.type == 'builder' || $scope.currentUser.type == 'architect') {
                    _.each(board.clients, function(client) {
                        if (client._id && client.hasSelect) {
                            $scope.availableInvite.push(client._id);
                        }
                    });
                    if ($scope.currentUser.type == 'builder') {
                        _.each(board.subcontractors, function(subcontractor) {
                            if (subcontractor._id && subcontractor.hasSelect) {
                                $scope.availableInvite.push(subcontractor._id);
                            }
                        });
                    }
                }
            }
            if ($scope.team._id) {
                _.each(team.leader, function(leader) {
                    $scope.availableInvite.push(leader);
                });
                _.each(team.member, function(member){
                    if (member._id && member.status == 'Active') {
                        $scope.availableInvite.push(member._id);
                    }
                });
            }
            if ($scope.currentBoard._id) {
                _.each($scope.currentBoard.invitees, function(invitee) {
                    if (invitee._id) {
                        _.remove($scope.availableInvite, {_id: invitee._id._id});
                    }
                });
            }
            _.uniq($scope.availableInvite, '_id');
            _.remove($scope.availableInvite, {_id: $scope.currentUser._id});
        });
    };

    function getAvailable(board) {
        $scope.available = [];
        if (board._id) {
            if (board.invitees.length > 0) {
                _.each(board.invitees, function(invitee) {
                    if (invitee._id) {
                        $scope.available.push(invitee._id);
                    }
                });
            }
            $scope.available.push(board.owner);
        }
    };  

    function getTasksAndFilesByBoard(board) {
        fileService.getFileInBoard({id: board._id}).$promise.then(function(res){
            $scope.files = res;
        });
        taskService.getByPackage({id: board._id, type: 'board'}).$promise.then(function(res){
            $scope.tasks = res;
            _.each($scope.tasks, function(task){
                task.isOwner = false;
                _.each(task.assignees, function(user) {
                    if (user._id == $scope.currentUser._id) {
                        task.isOwner = true
                    }
                });
            });
        });
    };

    function getUnreadMessage(board) {
        socket.emit('join',board._id);
        $scope.unreadMessages = $rootScope.unreadMessages;
        var unreadMessagesNumber = 0;
        var temp = 0;
        _.each($scope.unreadMessages, function(message) {
            if (message.element._id == board._id && message.referenceTo == "board-chat") {
                unreadMessagesNumber++;
            }
        });
        _.each($scope.unreadMessages, function(message){
            if (message.element._id == board._id && message.referenceTo == "board-chat") {
                board.hasUnreadMessage = true;
                for (var i = board.messages.length - 1; i >= 0; i--) {
                    if (board.messages[i].user._id != $scope.currentUser._id) {
                        board.messages[i].unread = true;
                        temp += 1;
                    } else {
                        board.messages[i].unread = false;
                    }
                    if (temp == unreadMessagesNumber) {
                        return false;
                    }
                };
            } else {
                board.hasUnreadMessage = false;
            }
        });
        if (board.hasUnreadMessage) {
            $("div#boardChatContent").scroll(function() {
                if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                    _.each($scope.unreadMessages, function(message){
                        $timeout(function(){
                            if (message.element._id == board._id) {
                                notificationService.markAsRead({_id: message._id}).$promise.then(function(res){
                                    $rootScope.$broadcast("notification:read", res);
                                });
                                board.hasUnreadMessage = false;
                                _.each(board.messages, function(message){
                                    message.unread = false;
                                });
                            }
                        },2000);
                    });
                }
            });
        }
    };

    function getAllChatMessageNotificationByBoard(board) {
        notificationService.getAllChatMessageNotificationByBoard({id: board._id}).$promise.then(function(res) {
            for (var i = board.messages.length - 1; i >= 0; i--) {
                board.messages[i].peopleHasSeen = [];
                _.each(res, function(notification){
                    _.each(notification.element.messages, function(message) {
                        if (message._id == board.messages[i]._id && !notification.unread) {
                            board.messages[i].peopleHasSeen.push(notification.owner.name);
                        }
                    });
                });
                board.messages[i].peopleHasSeen = _.uniq(board.messages[i].peopleHasSeen);
                if (board.messages[i].mentions.length > 0) {
                    _.each(board.messages[i].mentions, function(mention) {
                        // if (board.messages[i].text.indexOf(mention.name) != -1) {
                        //     board.messages[i].text = board.messages[i].text.substring(0, board.messages[i].text.indexOf(mention.name));
                        // }
                    });
                }
            };
        });
    };

    socket.on('boardChat:new', function (board) {
        $scope.currentBoard = board;
        getUnreadMessage(board);
        getAvailable(board);
        getTasksAndFilesByBoard(board);
        getAllChatMessageNotificationByBoard(board);
    });

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

    $scope.boards = [];
    $scope.currentBoard = {};
    boardService.getBoards({id: $stateParams.id}).$promise.then(function(res){
        $scope.boards = res;
        _.each($scope.boards, function(board) {
            board.isOwner = false;
            _.each(board.invitees, function(invitee){
                if (invitee._id) {
                    if (invitee._id._id == $scope.currentUser._id) {
                        board.isOwner = true;
                    }
                }
            });
        });
        _.each($scope.boards, function(board) {
            if (board.isOwner || board.owner._id == $scope.currentUser._id) {
                $scope.currentBoard = board;
                return false;
            }
        });
        if ($scope.currentBoard._id) {
            getUnreadMessage($scope.currentBoard);
            getAvailable($scope.currentBoard);
            getTasksAndFilesByBoard($scope.currentBoard);
            getAllChatMessageNotificationByBoard($scope.currentBoard);
        }
    });

    getAvailableAddedToNewBoard();

    $scope.selectBoard = function(board) {
        $scope.currentBoard = board;
        getUnreadMessage(board);
        getAvailable(board);
        getTasksAndFilesByBoard(board);
        getAllChatMessageNotificationByBoard(board);
        getAvailableAddedToNewBoard();
    };

    $scope.setInvite = function() {
        $scope.invite = {
            invitees: []
        };
    };

    $scope.inviteInInviteUser = function(invitee,index) {
        invitee.canRevoke = true;
        $scope.invite.invitees.push(invitee);
        $scope.availableInvite.splice(index,1);
    };

    $scope.revokeInInviteUser = function(assignee,index) {
        $scope.availableInvite.push(assignee);
        $scope.invite.invitees.splice(index,1);
    };

    $scope.invitePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            boardService.invitePeople({id: $scope.currentBoard._id}, $scope.invite).$promise.then(function(res){
                $scope.currentBoard = res;
                $scope.submitted = false;
                $("#invite_people").closeModal();
                $scope.invite.description = null;
                $scope.invite.invitees = [];
                getAvailable(res);
                getTasksAndFilesByBoard(res);
                getAvailableAddedToNewBoard();
            }, function(err){
                console.log(err);
            });
        }
    };

    $scope.setNewBoard = function(){
        $scope.board = {
            invitees: []
        };
    };

    $scope.inviteUser = function(invitee,index) {
        invitee.canRevoke = true;
        $scope.board.invitees.push(invitee);
        $scope.availableInvite.splice(index,1);
    };

    $scope.revokeUser = function(assignee,index) {
        $scope.availableInvite.push(assignee);
        $scope.board.invitees.splice(index,1);
    };

    $scope.createNewBoard = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            boardService.createBoard({id: $stateParams.id}, $scope.board).$promise.then(function(res){
                $scope.boards.push(res);
                $("#new_board").closeModal();
                $scope.submitted = false;
                $scope.board.name = null;
                $scope.board.invitees = [];
                $scope.currentBoard = res;
                getAvailable(res);
                getTasksAndFilesByBoard(res);
                getAvailableAddedToNewBoard();
            }, function(err){
                console.log(err);
            });
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
            belongToType: 'board',
            tags: $scope.selectedTags,
            isQuote: $scope.isQuote,
            assignees : []
        };
    };

    $scope.uploadNewAttachment = function() {
        uploadService.uploadInBoard({id: $scope.currentBoard._id, file: $scope.uploadFile}).$promise.then(function(res){
            $('#new_attachment').closeModal();
            $state.reload();
        });
    };

    $scope.assign = function(staff,index) {
        staff.canRevoke = true;
        $scope.task.assignees.push(staff);
        $scope.available.splice(index,1);
    };

    $scope.revoke = function(assignee,index) {
        $scope.available.push(assignee);
        $scope.task.assignees.splice(index,1);
    };

    $scope.task = {
        assignees : []
    };

    $scope.addNewTask = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            taskService.create({id: $scope.currentBoard._id, type: 'board'},$scope.task).$promise.then(function(res){
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
                getAvailable($scope.currentBoard);
                $scope.submitted = false;
            }, function(res){
                console.log(res);
            });
        }
    };

    $scope.complete = function(task) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedBy = $scope.currentUser._id;
            task.completedAt = new Date();
        } else {
            task.completedBy = null;
            task.completedAt = null;
        }

        taskService.update({id : task._id, type : task.type},task).$promise
        .then(function(res) {
            console.log(res);
            getTasksAndFilesByBoard($scope.currentBoard);
        });
    };

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        } else if (($event.keyCode === 32 || $event.keyCode === 8) && $scope.showPopup) {
            $scope.showPopup = false;
        } else if ($event.keyCode === 9) {
            $event.preventDefault();
            if ($scope.mentionPeople.length > 0) {
                $scope.getMentionValue($scope.mentionPeople[0]);
            } else {
                $scope.getMentionValue($scope.available[0]);
            }
        }
    };


    $scope.message = {
        mentions: []
    };
    $scope.showPopup = false;
    $scope.mentionString = '';

    $scope.getMentionValue = function(mention) {
        $scope.message.text = $scope.message.text.substring(0, $scope.message.text.length - ($scope.mentionString.length +1));
        $scope.message.text += mention.name;  
        $scope.message.mentions.push(mention._id);
        $scope.showPopup = false;
        $timeout(function(){ 
            document.getElementById("textarea1-board-chat").focus();
        },500);
    };

    $scope.$watch('message.text', function(newValue, oldValue) {
        if (newValue) {
            if (newValue.indexOf("@") != -1) {
                $scope.showPopup = true;
                $scope.mentionString = newValue.substring(newValue.indexOf("@") + 1);
                $scope.mentionPeople = [];
                _.each($scope.available, function(item) {
                    if (item.name.indexOf($scope.mentionString) != -1) {
                        $scope.mentionPeople.push(item);
                    }
                });
            }
        }
    });

    $scope.sendMessage = function() {
        boardService.sendMessage({id: $scope.currentBoard._id}, $scope.message).$promise.then(function(res) {
            $scope.currentBoard = res;
            $scope.message.text = null;
            $scope.message.mentions = [];
            getAllChatMessageNotificationByBoard(res);
        }, function(err){
            console.log(err);
        });
    };

    $scope.downloadFile = function(file) {
        var blob = {
            url: file.path,
            filename: file.name,
            mimetype: file.mimetype,
            size: file.size
        };

        filepicker.exportFile(
            blob,
            function(Blob){
                console.log(Blob.url);
            }
        );
    };
});