angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, peopleService, $mdToast, tender, $mdDialog, $state, socket) {
    $scope.tender = tender;
    $scope.currentUser = $rootScope.currentUser;
    $rootScope.title = $scope.tender.tenderName + " detail";

    socket.emit('join', tender._id);
    socket.on("broadcast:message", function(data) {
        var latestActivity = _.last(data.inviterActivities);
        if (latestActivity.type === "broadcast-message" && _.indexOf(latestActivity.element.userMembers, $scope.currentUser._id) !== -1) {
            $scope.tender.inviterActivities.push(latestActivity);
        }
    });

    function getTenderers() {
        $scope.teamLeader = false;
        $scope.tenderers = [$scope.tender.inviter];
        _.each($scope.tender.tenderers, function(tenderer) {
            if (tenderer._id) {
                $scope.teamLeader = true;
                $scope.tenderers.push(tenderer._id);
            } else {
                $scope.tenderers.push({email:tenderer.email, name: tenderer.name});
            }
        });
        _.remove($scope.tenderers, {_id: $rootScope.currentUser._id});
    };

    $scope.showModal = function($event, name) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectTendersDetailCtrl',
            resolve: {
                tender: function($stateParams, peopleService) {
                    return peopleService.getTender({id: $stateParams.id, tenderId: $stateParams.tenderId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-tenders/detail/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.cancelNewTenderModal = function () {
        $mdDialog.cancel();
    };

    $scope.selectWinner = function(tenderer) {
        var confirm = $mdDialog.confirm().title("Do you want to select this tenderer as winner?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            peopleService.selectWinnerTender({id: $stateParams.id},tenderer).$promise.then(function(res) {
                $scope.showToast("Select winner successfully!");
                $state.go("project.team.all", {id: $stateParams.id});
            }, function(err) {
                $scope.showToast(err.data.msg);
            });
        }, function() {
            
        });
    };

    $scope.distributeTender = function() {
        var confirm = $mdDialog.confirm().title("Do you want to distribute this tenderer?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            peopleService.updateDistributeStatus({id: $stateParams.id, tenderId: $stateParams.tenderId}).$promise.then(function(res) {
                $scope.showToast("Edit distribute status successfully");
                $scope.tender.isDistribute = !$scope.tender.isDistribute;
                $rootScope.$broadcast("Tender.Updated", res);
            }, function(err) {$scope.showToast("Error");});
        }, function() {
            
        });
    };

    $scope.selectMember = function(index) {
        $scope.select = false;
        $scope.tenderers[index].select = !$scope.tenderers[index].select;
    };

    $scope.selectAllMember = function() {
        $scope.select = !$scope.select;
        _.each($scope.tenderers, function(tenderer) {
            tenderer.select = $scope.select;
        });
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };
    $scope.uploadFile = {};
    function onSuccess(file, type){
        file.type = "file";
        if (type === "tender") {
            file.tenderId = $stateParams.tenderId;
            $scope.uploadFile = file;
        } else if (type === "addendum") {
            $scope.addendum.file = file;
        }
    };

    function setAddendum() {
        $scope.addendum = {
            members: []
        }
    };
    setAddendum();
    $scope.sendAddendum = function() {
        peopleService.attachAddendum({id: $stateParams.id, tenderId: $stateParams.tenderId}, $scope.addendum).$promise.then(function(res) {
            $scope.cancelNewTenderModal();
            $scope.showToast("Attach addendum successfully");
            $rootScope.$broadcast("Tender.Updated", res);
        }, function(err){$scope.showToast("Error");});
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.setInviteMembers = function() {
        $scope.tender.newMembers = [];
    };
    $scope.setInviteMembers();

    $scope.addInvitee = function(email, name) {
        if (email && email != '' && name && name != '') {
            if (_.findIndex($scope.tender.newMembers, {email: email}) === -1) {
                $scope.tender.newMembers.push({email: email, name: name});
                $scope.email = null;
                $scope.name = null;
            } else {
                $scope.showToast("This email has already added");
            }
        }
    };  

    $scope.removeInvitee = function(index) {
        $scope.tender.newMembers.splice(index, 1);
    };

    $scope.inviteTenderer = function() {
        if ($scope.tender.newMembers.length === 0) {
            $scope.showToast("Please enter at least 1 tenderer");
            return;
        } else {
            $scope.tender.editType = "invite-tender";
            peopleService.updateTender({id: $stateParams.id, tenderId: $stateParams.tenderId}, $scope.tender).$promise.then(function(res) {
                $scope.cancelNewTenderModal();
                $scope.showToast("Invite tenderer successfully");
                $rootScope.$broadcast("Tender.Updated", res);
            }, function(err) {$scope.showToast("Error");});
        }
    };

    $scope.broadcastMessage = {
        members: []
    };

    $scope.sendBroadcastMessage = function(form) {
        if (form.$valid) {
            $scope.broadcastMessage.editType = "broadcast-message";
            $scope.broadcastMessage.members = _.filter($scope.tenderers, {select: true});
            if ($scope.broadcastMessage.members.length === 0) {
                $scope.showToast("Please select at least 1 tenderer");
                return;
            } else {
                peopleService.updateTender({id: $stateParams.id, tenderId: $stateParams.tenderId}, $scope.broadcastMessage).$promise.then(function(res) {
                    $scope.cancelNewTenderModal();
                    $scope.showToast("Send message successfully");
                    $rootScope.$broadcast("Tender.Updated", res);
                }, function(err) {$scope.showToast("Error");});
            }
        } else {
            $scope.showToast("Please check your input again");
            return;
        }
    };

    $scope.submitTender = function() {
        if (!$scope.uploadFile.tenderId) {
            $scope.showToast("Please check your input");
            return;
        }
        peopleService.submitATender({id: $stateParams.id}, $scope.uploadFile).$promise.then(function(res) {
            $scope.cancelNewTenderModal();
            $scope.showToast("Submit a tender successfully");
            $rootScope.$broadcast("Tender.Updated", res);
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.showReviewFileModal = function($event, addendum) {
        $mdDialog.show({
            targetEvent: $event,
            controller: function($scope, $stateParams, $state){
                $scope.addendum = addendum;
                $scope.closeModal = function() {
                    $mdDialog.cancel();
                };

                $scope.download = function() {
                    filepicker.exportFile(
                        {url: addendum.element.link, filename: addendum.element.name},
                        function(Blob){
                            console.log(Blob.url);
                        }
                    );
                };
            },
            templateUrl: 'app/modules/project/project-tenders/detail/addendum-riWindow.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    getTenderers();
    $rootScope.$on("Tender.Updated", function(event, data) {
        $scope.tender = data;
        $scope.setInviteMembers();
    });
});