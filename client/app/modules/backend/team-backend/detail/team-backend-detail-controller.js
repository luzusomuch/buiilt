angular.module('buiiltApp').controller('TeamBackendDetailCtrl', function($scope, projectLimit, team, projectService, $mdToast) {
    $scope.team = team;
    $scope.projectLimit = projectLimit;
    $scope.number = ($scope.projectLimit._id) ? $scope.projectLimit.number : 1;

    $scope.showEditLimitProject = false;

    $scope.updateLimitProject = function(form) {
        if (form.$valid) {
            projectService.changeProjectLimit({teamId: team._id, number: $scope.number}).$promise.then(function(res) {
                $scope.showToast("Successfully");
                $scope.showEditLimitProject = false;
            }, function(err) {$scope.showToast("Error");});
        } else {
            $scope.showToast("Error");
        }
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };
});