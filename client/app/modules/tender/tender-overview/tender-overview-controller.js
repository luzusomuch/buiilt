angular.module('buiiltApp').controller('tenderOverviewCtrl', function($scope, $rootScope, $mdToast, tender, $mdDialog, $state, socket, tenderService, $stateParams) {
	$scope.tender = tender;
    $rootScope.title = tender.name  + " Overview";
    $scope.currentUser = $rootScope.currentUser;

    socket.emit("join", tender._id);
    socket.on("tender:update", function(data) {
        $scope.tender = data;
        checkAcknowLedgement($scope.tender);
    });

    function checkAcknowLedgement(tender) {
        _.each(tender.activities, function(activity) {
            if (activity.type === "attach-addendum") {
                activity.isAcknow = false;
                if (_.findIndex(activity.acknowledgeUsers, function(item) {
                    if (item._id && item.isAcknow) {
                        return item._id._id == $scope.currentUser._id;
                    }
                }) !== -1) {
                    activity.isAcknow = true;
                }
            }
        });
    };
    checkAcknowLedgement($scope.tender);

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

    $scope.addendum = {};

    $scope.cancelNewTenderModal = function() {
        $mdToast.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.showModal = function(event, name) {
        $mdDialog.show({
            targetEvent: event,
            controller: 'tenderOverviewCtrl',
            resolve: {
                tender: function($stateParams, tenderService) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }
            },
            templateUrl: 'app/modules/tender/partials/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.scope = {};
    $scope.attachScope = function() {
        if ($scope.scope.description && $scope.scope.description.length > 0) {
            $scope.scope.editType = "attach-scope";
            $scope.updateTender($scope.scope);
        } else {
            $scope.showToast("Please check your input");
            return false;
        }
    };

    $scope.sendAddendum = function() {
        if ($scope.addendum.name && $scope.addendum.name.length === 0) {
            $scope.showToast("Please check your input");
            return false;
        } else if ($scope.addendum.description && $scope.addendum.description.length === 0) {
            $scope.showToast("Please check your input");
            return false;
        } else {
            $scope.addendum.editType = "attach-addendum";
            $scope.updateTender($scope.addendum);
        }
    };

    $scope.distributeTender = function() {
        if ($scope.tender.members.length === 0) {
            $scope.showToast("You cann\'t update distribute of this tender until have one tender");
            return;
        } else {
            if (_.findIndex($scope.tender.activities, function(activity) {
                return activity.type === "attach-scope";
            }) !== -1) {
                var confirm = $mdDialog.confirm().title("Do you want to distribute this tenderer?").ok("Yes").cancel("No");
                $mdDialog.show(confirm).then(function() {
                    $scope.tender.editType = "distribute-status";
                    $scope.updateTender($scope.tender);
                }, function() {
                    
                });
            } else {
                $scope.showToast("You can\'t update distribute of this status until have one tender scope");
                return false;
            }
        }
    };

    $scope.tender.newMembers = [];
    $scope.addInvitee = function(email, name) {
        if (email && email != '' && name && name != '') {
            if (_.findIndex($scope.tender.newMembers, {email: email}) === -1) {
                $scope.tender.newMembers.push({email: email, name: name});
                $scope.email = null;
                $scope.name = null;
            } else {
                $scope.showToast("This Invitee Has Already Been Added.");
            }
        }
    }; 
    $scope.removeInvitee = function(index) {
        $scope.tender.newMembers.splice(index, 1);
    };
    $scope.inviteTenderer = function() {
        if ($scope.tender.newMembers.length === 0) {
            $scope.showToast("Please Enter The Email Of At Least 1 Invitee.");
            return;
        } else {
            $scope.tender.editType = "invite-tender";
            $scope.updateTender($scope.tender);
        }
    };

    $scope.selectWinner = function(tenderer) {
        var confirm = $mdDialog.confirm().title("Do you want to select this tenderer as winner?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            tenderService.selectWinner({id: $stateParams.tenderId, tendererId: tenderer._id}).$promise.then(function() {
                $scope.cancelDialog();
                $scope.showToast("Successfully");
            }, function (err) {$scope.showToast("Error");});
        }, function() {
            
        });
    };

    $scope.updateTender = function(tender) {
        tenderService.update({id: $stateParams.tenderId}, tender).$promise.then(function(res) {
            $mdDialog.cancel();
            $scope.showToast("Successfully");
        }, function(err){$scope.showToast("There Has Been An Error...");});
    };

    $scope.acknowledgement = function(activity) {
        console.log(activity);
        tenderService.acknowledgement({id: $stateParams.tenderId, activityId: activity._id},{}).$promise.then(function(res) {
            $mdDialog.cancel();
            activity.isAcknow = true;
            $scope.showToast("Successfully");
        }, function(err){$scope.showToast("There Has Been An Error...");});
    };
	
	$scope.cancelDialog = function(){
		$mdDialog.cancel();
	};
});