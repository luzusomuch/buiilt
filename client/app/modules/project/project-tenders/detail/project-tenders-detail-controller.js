angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, peopleService, $mdToast, tender, $mdDialog) {
    $scope.tender = tender;

    $scope.openSelectWinnerModal = function($event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectTendersDetailCtrl',
            resolve: {
                tender: function($stateParams, peopleService) {
                    return peopleService.getTender({id: $stateParams.id, tenderId: $stateParams.tenderId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-tenders/detail/select-winner-tender-modal.html',
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
                console.log(res);
                $scope.showToast("Select winner successfully!");
            }, function(err) {
                $scope.showToast("Something went wrong!");
            });
        }, function() {
            
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
});