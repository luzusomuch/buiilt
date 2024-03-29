angular.module('buiiltApp').controller('tenderInviteeDetailCtrl', function($rootScope, $scope, $timeout, $q, tender, tenderService, $mdDialog, $mdToast, socket, $stateParams) {
    $scope.tender = tender;
    $scope.currentUser = $rootScope.currentUser;
    $rootScope.title = $scope.tender.name + "'s message";

    /*Filter out current tenderer is talking with tender owner*/
    function findCurrentTenderer(members) {
        var index = _.findIndex(members, function(member) {
            return member._id==$stateParams.inviteeId;
        });
        $scope.currentTenderere = members[index];
    };

    findCurrentTenderer($scope.tender.members);

    socket.emit("join", $stateParams.inviteeId);
    /*Receive when invitee updated*/
    socket.on("invitee:updated", function(data) {
        if ($scope.currentTenderere._id==data._id) {
            $scope.currentTenderere = data;
        }
    });

    /*Show toast dialog*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*Open modal with valid name*/
    $scope.showModal = function(event, name) {
        $mdDialog.show({
            targetEvent: event,
            controller: 'tenderInviteeDetailCtrl',
            resolve: {
                tender: ["$stateParams", "tenderService", function($stateParams, tenderService) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }]
            },
            templateUrl: 'app/modules/tender/tender-invitees/detail/partials/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.message = {};

    /*Send message with valid message text*/
    $scope.sendMessage = function(form) {
        if (form.$valid) {
            $scope.message.text = $scope.message.text.trim();
            if ($scope.message.text.length===0) {
                $scope.showToast("Please Enter a Message...");
                return false;
            } 
            $scope.message.type = "send-message";
            $scope.updateTenderInvitee($stateParams.inviteeId, $scope.message);
        } else {
            $scope.showToast("Please Check Your Inputs...");
        }
    };

    $scope.uploadFile = {};

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadFile.file = file;
    };

    /*Attach file to tenderer*/
    $scope.attachTender = function(form) {
        if (form.$valid) {
            if (!$scope.uploadFile.file) {
                $scope.showToast("Please Select At Least One File...");
                return false;
            }
            $scope.uploadFile.type = "attach-tender";
            $scope.updateTenderInvitee($stateParams.inviteeId, $scope.uploadFile);
        } else {
            $scope.showToast("Please Check Your Inputs...");
        }
    }

    /*Update tenderer information*/
    $scope.updateTenderInvitee = function(inviteeId, data) {
        tenderService.updateTenderInvitee({id: $stateParams.tenderId, activityId: inviteeId}, data).$promise.then(function(res) {
            $scope.closeModal();
            $scope.showToast("You Have Successfully Attached This Item.");
        }, function(err) {$scope.showToast("There Has Been An Error...");});
    };

    /*Open tender file*/
    $scope.openTenderDetail = function($event, file) {
        $mdDialog.show({
            targetEvent: $event,
            controller: ["$scope", "$stateParams", "$state", 
            function($scope, $stateParams, $state){
                $scope.file = file;

                $scope.closeModal = function() {
                    $mdDialog.cancel();
                };

                $scope.download = function() {
                    filepicker.exportFile(
                        {url: $scope.file.link, filename: $scope.file.name},
                        function(Blob){
                            console.log(Blob.url);
                        }
                    );
                };
            }],
            templateUrl: 'app/modules/tender/tender-invitees/detail/partials/view-tender-file.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };
});