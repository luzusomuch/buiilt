angular.module('buiiltApp')
.controller('BoardsCtrl', function ($scope, $rootScope, $state, team, currentUser, builderPackage, boardService, $stateParams, fileService, filepickerService, uploadService, taskService, socket, notificationService, peopleService, $timeout) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;
    $scope.availableInvite = [];

    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
        if (_.findIndex(res.builders, function(item) {
            if (item._id) {
                return item._id._id == $scope.currentUser._id;
            }}) != -1) {
            $scope.currentUser.type = 'builder';
        } else if (_.findIndex(res.architects, function(item) {
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'architect';
        } else if (_.findIndex(res.clients, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'client';
        } else if (_.findIndex(res.subcontractors, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'subcontractor';
        } else if (_.findIndex(res.consultants, function(item){
            if (item._id) {return item._id._id == $scope.currentUser._id;}
            }) != -1) {
            $scope.currentUser.type = 'consultant';
        } else {
            $scope.currentUser.type = 'default';
        }
        if ($scope.builderPackage.projectManager.type == 'architect') {
            if ($scope.currentUser.type == 'builder' || $scope.currentUser.type == 'client') {
                _.each(res.architects, function(architect) {
                    if (architect._id) {
                        $scope.availableInvite.push(architect._id);
                    }
                });
                _.each(res.consultants, function(consultant) {
                    if (consultant._id) {
                        $scope.availableInvite.push(consultant._id);
                    }
                });
                if ($scope.currentUser.type == 'builder') {
                    _.each(res.subcontractors, function(subcontractor) {
                    if (subcontractor._id) {
                        $scope.availableInvite.push(subcontractor._id);
                    }
                });
                }
            } else if ($scope.currentUser.type == 'architect') {
                _.each(res.builders, function(builder) {
                    if (builder._id) {
                        $scope.availableInvite.push(builder._id);
                    }
                });
                _.each(res.clients, function(client) {
                    if (client._id) {
                        $scope.availableInvite.push(client._id);
                    }
                });
                _.each(res.consultants, function(consultant) {
                    if (consultant._id) {
                        $scope.availableInvite.push(consultant._id);
                    }
                });
            }
        } else if ($scope.builderPackage.projectManager.type == 'builder') {
            if ($scope.currentUser.type == 'builder') {
                _.each(res.architects, function(architect) {
                    if (architect._id) {
                        $scope.availableInvite.push(architect._id);
                    }
                });
                _.each(res.consultants, function(consultant) {
                    if (consultant._id) {
                        $scope.availableInvite.push(consultant._id);
                    }
                });
                _.each(res.subcontractors, function(subcontractor) {
                    if (subcontractor._id) {
                        $scope.availableInvite.push(subcontractor._id);
                    }
                });
                _.each(res.clients, function(client) {
                    if (client._id) {
                        $scope.availableInvite.push(client._id);
                    }
                });
            } else if ($scope.currentUser.type == 'client' || $scope.currentUser.type == 'architect') {
                _.each(res.builders, function(builder) {
                    if (builder._id) {
                        $scope.availableInvite.push(builder._id);
                    }
                });
                _.each(res.consultants, function(consultant) {
                    if (consultant._id) {
                        $scope.availableInvite.push(consultant._id);
                    }
                });
            } 
        } else {
            if ($scope.currentUser.type == 'client') {
                _.each(res.builders, function(builder) {
                    if (builder._id) {
                        $scope.availableInvite.push(builder._id);
                    }
                });
                _.each(res.architects, function(architect) {
                    if (architect._id) {
                        $scope.availableInvite.push(architect._id);
                    }
                });
                _.each(res.consultants, function(consultant) {
                    if (consultant._id) {
                        $scope.availableInvite.push(consultant._id);
                    }
                });
            } else if ($scope.currentUser.type == 'builder' || $scope.currentUser.type == 'architect') {
                _.each(res.clients, function(client) {
                    if (client._id) {
                        $scope.availableInvite.push(client._id);
                    }
                });
                if ($scope.currentUser.type == 'builder') {
                    _.each(res.subcontractors, function(subcontractor) {
                        if (subcontractor._id) {
                            $scope.availableInvite.push(subcontractor._id);
                        }
                    });
                }
            }
        }
    });

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
            console.log($scope.tasks);
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

    socket.on('boardChat:new', function (board) {
        $scope.currentBoard = board;
        getUnreadMessage(board);
        getAvailable(board);
        getTasksAndFilesByBoard(board);
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
            if (board.isOwner || board.owner == $scope.currentUser._id) {
                $scope.currentBoard = board;
                return false;
            }
        });
        getUnreadMessage($scope.currentBoard);
        getAvailable($scope.currentBoard);
        getTasksAndFilesByBoard($scope.currentBoard);
    });

    $scope.selectBoard = function(board) {
        $scope.currentBoard = board;
        getUnreadMessage(board);
        getAvailable(board);
        getTasksAndFilesByBoard(board);
    };

    $scope.invite = {};
    $scope.invitePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            boardService.invitePeople({id: $scope.currentBoard._id}, $scope.invite).$promise.then(function(res){
                $scope.currentBoard = res;
                $scope.submitted = false;
                $("#invite_people").closeModal();
                $scope.invite.description = null;
                $scope.invite.email = null;
                getAvailable(res);
                getTasksAndFilesByBoard(res);
            }, function(err){
                console.log(err);
            });
        }
    };

    $scope.board = {
        invitees: []
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
                $scope.boards.name = null;
                $scope.boards.email = null;
                $scope.currentBoard = res;
                getAvailable(res);
                getTasksAndFilesByBoard(res);
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
        }
    };


    $scope.message = {
    };
    $scope.showPopup = false;

    $scope.getMentionValue = function(mention) {
        $scope.message.text = $scope.message.text.substring(0, $scope.message.text.length -1);
        $scope.message.text += mention.name;  
        $scope.showPopup = false;
    };

    $scope.$watch('message.text', function(newValue, oldValue) {
        if (newValue) {
            if (newValue.slice(-1) == "@") {
                $scope.showPopup = true;
            }
        }
    });

    $scope.sendMessage = function() {
        boardService.sendMessage({id: $scope.currentBoard._id}, $scope.message).$promise.then(function(res) {
            $scope.currentBoard = res;
            $scope.message.text = null;
        }, function(err){
            console.log(err);
        });
    };

    $scope.downloadFile = function(file) {
        console.log(file);
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