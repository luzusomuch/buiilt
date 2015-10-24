angular.module('buiiltApp')
.controller('BoardsCtrl', function ($scope, $rootScope, $state, team, currentUser, builderPackage, boardService, $stateParams, fileService, filepickerService, uploadService, taskService) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.currentUser = currentUser;
    $scope.submitted = false;

    function getAvailable(board) {
        $scope.available = [];
        _.each(board.invitees, function(invitee) {
            if (invitee._id) {
                $scope.available.push(invitee._id);
            }
        });
    };  

    function getTasksAndFilesByBoard(board) {
        fileService.getFileInBoard({id: board._id}).$promise.then(function(res){
            $scope.files = res;
            _.each($scope.files, function(file){
                file.isOwner = false;
                _.each(file.usersRelatedTo, function(user) {
                    if (user == $scope.currentUser._id) {
                        file.isOwner = true
                    }
                });
            });
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

    function getUnreadMessage = function(board) {
        socket.emit('join',board._id);
        $scope.unreadMessages = $rootScope.unreadMessages;
        var unreadMessagesNumber = 0;
        _.each($scope.unreadMessages, function(message){
            if (message.element._id == board._id) {
                board.hasUnreadMessage = true;
                for (var i = board.messages.length - 1; i >= 0; i--) {
                    if (board.messages[i].user._id != $scope.currentUser._id) {
                        board.messages[i].unread = true;
                        unreadMessagesNumber++;
                    } else {
                        board.messages[i].unread = false;
                    }
                    if (unreadMessagesNumber == $scope.unreadMessages.length) {
                        break;
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
                        if (message.element._id == board._id) {
                            notificationService.markAsRead({_id: message._id}).$promise.then(function(res){
                                $rootScope.$broadcast("notification:read", res);
                            });
                            board.hasUnreadMessage = false;
                            _.each(board.messages, function(message){
                                message.unread = false;
                            });
                        }
                    });
                }
            });
        }
    };

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
            }, function(err){
                console.log(err);
            });
        }
    };

    $scope.board = {};
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

    $scope.assignToDocument = function(staff,index) {
        staff.canRevoke = true;
        $scope.uploadFile.assignees.push(staff);
        $scope.available.splice(index,1);
    };

    $scope.revokeFromDocument = function(assignee,index) {
        $scope.available.push(assignee);
        $scope.uploadFile.assignees.splice(index,1);
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

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        }
    };

    $scope.message = {};
    $scope.sendMessage = function() {
        boardService.sendMessage({id: $scope.currentBoard._id}, $scope.message).$promise.then(function(res) {
            $scope.currentBoard = res;
            $scope.message.text = null;
        }, function(err){
            console.log(err);
        });
    };
});