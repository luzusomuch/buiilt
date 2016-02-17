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
    $scope.tender.dateEnd = new Date($scope.tender.dateEnd);
    $scope.attachScope = function() {
        if ($scope.tender.description && $scope.tender.description.length > 0) {
            $scope.tender.editType = "attach-scope";
            $scope.updateTender($scope.tender);
        } else {
            $scope.showToast("Please Check Your Inputs...");
            return false;
        }
    };

    $scope.sendAddendum = function() {
        if ($scope.addendum.name && $scope.addendum.name.length === 0) {
            $scope.showToast("Please Check Your Inputs...");
            return false;
        } else if ($scope.addendum.description && $scope.addendum.description.length === 0) {
            $scope.showToast("Please Check Your Inputs...");
            return false;
        } else {
            $scope.addendum.editType = "attach-addendum";
            $scope.updateTender($scope.addendum);
        }
    };

    $scope.distributeTender = function() {
        if ($scope.tender.members.length === 0) {
            $scope.showToast("Please Add One Invitee Before Distributing Your Tender...");
            return;
        } else {
            if (_.findIndex($scope.tender.activities, function(activity) {
                return activity.type === "attach-scope";
            }) !== -1) {
                var confirm = $mdDialog.confirm().title("Do you want to distribute this tender?").ok("Yes").cancel("No");
                $mdDialog.show(confirm).then(function() {
                    $scope.tender.editType = "distribute-status";
                    $scope.updateTender($scope.tender);
                }, function() {
                    
                });
            } else {
                $scope.showToast("Please Attach a Scope Before Distributing Your Tender...");
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
            $scope.showToast("Please Enter The Email Of At Least 1 Invitee...");
            return;
        } else {
            $scope.tender.editType = "invite-tender";
            $scope.updateTender($scope.tender);
        }
    };

    $scope.selectWinner = function(tenderer) {
        var confirm = $mdDialog.confirm().title("Do you want to select this tenderer as the winner?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            tenderService.selectWinner({id: $stateParams.tenderId, tendererId: tenderer._id}).$promise.then(function() {
                $scope.cancelDialog();
                $scope.showToast("You Have Successfully Selected the Winner.");
            }, function (err) {$scope.showToast("Error");});
        }, function() {
            
        });
    };

    $scope.updateTender = function(tender) {
        tenderService.update({id: $stateParams.tenderId}, tender).$promise.then(function(res) {
            $mdDialog.cancel();
            $scope.showToast("You Have Updated the Tender Successfully.");
        }, function(err){$scope.showToast("There Has Been An Error...");});
    };

    $scope.acknowledgement = function(activity) {
        console.log(activity);
        tenderService.acknowledgement({id: $stateParams.tenderId, activityId: activity._id},{}).$promise.then(function(res) {
            $mdDialog.cancel();
            activity.isAcknow = true;
            $scope.showToast("Your Acknowledgement Has Been Sent.");
        }, function(err){$scope.showToast("There Has Been An Error...");});
    };
	
	$scope.cancelDialog = function(){
		$mdDialog.cancel();
	};
});