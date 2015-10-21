angular.module('buiiltApp')
.controller('BoardsCtrl', function ($scope, $state, team, builderPackage, boardService, $stateParams, fileService, filepickerService, uploadService, taskService) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.submitted = false;

    function getAvailable(board) {
        $scope.available = [];
        _.each(board.invitees, function(invitee) {
            if (invitee._id) {
                $scope.available.push(invitee._id);
            }
        });
        console.log($scope.available);
    };  

    $scope.boards = [];
    $scope.currentBoard = {};
    boardService.getBoards({id: $stateParams.id}).$promise.then(function(res){
        $scope.boards = res;
        $scope.currentBoard = _.first($scope.boards);
        getAvailable($scope.currentBoard);
        fileService.getFileInBoard({id: $scope.currentBoard._id}).$promise.then(function(res){
            $scope.files = res;
            console.log(res);
        });
        taskService.get({id: $scope.currentBoard._id, type: 'board'}).$promise.then(function(res){
            $scope.tasks = res;
            console.log(res);
        });
    });

    $scope.selectBoard = function(board) {
        $scope.currentBoard = board;
        console.log(board);
    };

    $scope.invite = {};
    $scope.invitePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            console.log($scope.invite);
            boardService.invitePeople({id: $scope.currentBoard._id}, $scope.invite).$promise.then(function(res){
                console.log(res);
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
                console.log(res);
                $scope.boards.push(res);
                $("#new_board").closeModal();
                $scope.submitted = false;
                $scope.boards.name = null;
                $scope.boards.email = null;
            }, function(err){
                console.log(err);
            });
        }
    };

    $scope.uploadFile = {};
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
        };
    };

    $scope.uploadNewAttachment = function() {
        console.log($scope.currentBoard);
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
                console.log(res);
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
});