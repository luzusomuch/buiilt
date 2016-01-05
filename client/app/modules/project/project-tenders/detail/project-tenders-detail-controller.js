angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, peopleService, $mdToast, tender) {
    $scope.tender = tender;

    $scope.selectWinner = function() {
        peopleService.selectWinnerTender({id: $stateParams.id},{}).$promise.then(function(res) {
            console.log(res);
            $scope.showToast("Select winner successfully!");
        }, function(err) {
            $scope.showToast("Something went wrong!");
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };
});