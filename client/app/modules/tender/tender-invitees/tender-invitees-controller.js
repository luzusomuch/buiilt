angular.module('buiiltApp').controller('tenderInviteesCtrl', function($rootScope, $scope, $timeout, $q, tender, tenderService, $mdDialog, $mdToast, socket, $state) {
    $scope.currentUser = $rootScope.currentUser;
    $scope.tender = tender;
    $rootScope.title = $scope.tender.name + "'s invitees";

    /*Receive when tender updated*/
    socket.on("tender:update", function(data) {
        $scope.tender = data;
    });

    /*Close opening modal*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*Show modal with valid name*/
    $scope.showModal = function(event, name) {
        $mdDialog.show({
            targetEvent: event,
            controller: 'tenderOverviewCtrl',
            resolve: {
                tender: ["$stateParams", "tenderService", function($stateParams, tenderService) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }]
            },
            templateUrl: 'app/modules/tender/partials/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };
});