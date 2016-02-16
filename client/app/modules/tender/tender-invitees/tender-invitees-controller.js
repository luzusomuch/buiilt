angular.module('buiiltApp').controller('tenderInviteesCtrl', function($rootScope, $scope, $timeout, $q, tender, tenderService, $mdDialog, $mdToast, socket, $state) {
    $scope.currentUser = $rootScope.currentUser;
    $scope.tender = tender;
    $rootScope.title = $scope.tender.name + "'s invitees";

    socket.on("tender:update", function(data) {
        $scope.tender = data;
    });

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
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

    $scope.updateTender = function(tender) {
        tenderService.update({id: $stateParams.tenderId}, tender).$promise.then(function(res) {
            $mdDialog.cancel();
            $scope.showToast("Successfully");
        }, function(err){$scope.showToast("There Has Been An Error...");});
    };
});