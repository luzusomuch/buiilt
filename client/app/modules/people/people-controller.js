angular.module('buiiltApp')
.controller('PeopleCtrl', function ($scope, $rootScope, team, builderPackage, teamService, filepickerService, uploadService, $stateParams, $state, fileService, peopleService) {
    $scope.team = team;
    $scope.currentTeamMember = [];
    $scope.currentTeamMember = $scope.team.leader;
    _.each($scope.team.member, function(member){
        if (member._id && member.status == 'Active') {
            $scope.currentTeamMember.push(member._id);
        }
    });
    $scope.builderPackage = builderPackage;
    $scope.submitted = false;  
    $scope.currentSelect = 'info';

    $scope.invite = {};
    $scope.invitePeople = function(form) {
        $scope.submitted = true;
        if (form.$valid) {
            if ($scope.invite.type == 'addTeamMember') {
                var emails = [];
                emails.push({email:$scope.invite.email});
                teamService.addMember({id: $scope.currentTeam._id},emails).$promise
                .then(function(team) {
                    $scope.currentTeam = team;
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
});