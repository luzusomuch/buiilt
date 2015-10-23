angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService, taskService, peopleChatService, authService) {
    $scope.team = team;
    $scope.builderPackage = builderPackage;
    $scope.submitted = false;  
    $scope.selectedUser = {};

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
    };

    peopleService.getInvitePeople({id: $stateParams.id}).$promise.then(function(res){
        $scope.invitePeople = res;
        getAvailableUser($scope.invitePeople);
        console.log(res);

        taskService.getByPackage({id: res._id, type: 'people'}).$promise.then(function(res){
            $scope.tasks = res;
            console.log(res);
        });
    });

    $scope.invite = {};
    $scope.inviteMorePeople = function(form) {
        $scope.submitted = true;
        console.log(form.$valid);
        if (form.$valid) {
            console.log($scope.invite);
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
                    console.log(res);
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
        console.log(res);
    });

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
            belongToType: 'people',
            tags: $scope.selectedTags,
            isQuote: $scope.isQuote,
        };
    };

    $scope.uploadNewAttachment = function() {
        uploadService.uploadInPeople({id: $stateParams.id, file: $scope.uploadFile}).$promise.then(function(res){
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
            taskService.create({id: $scope.invitePeople._id, type: 'people'},$scope.task).$promise.then(function(res){
                console.log(res);
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
        }
    };

    $scope.selectUser = function(user, type) {
        $scope.selectedUser = user;
        $scope.selectedUser.type = type;

        peopleChatService.selectPeople(
            {id: $scope.invitePeople._id},
            {project: $stateParams.id, user: user._id}
        ).$promise.then(function(res){
            console.log(res);
            $scope.selectedChatPeople = res;
        }, function(err){
            console.log(err);
        });
    };

    $scope.enterMessage = function ($event) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.sendMessage();
        }
    };

    $scope.message = {};
    $scope.sendMessage = function() {
        peopleChatService.sendMessage({id: $scope.selectedChatPeople._id}, $scope.message).$promise.then(function(res) {
            console.log(res);
            $scope.selectedChatPeople = res;
            $scope.message.text = null;
        }, function(err){
            console.log(err);
        });
    };
});