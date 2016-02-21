angular.module('buiiltApp').controller('UserBackendDetailTenderCtrl', function($scope, tender, $stateParams, $state, fileService) {
    fileService.getProjectFiles({id: tender.project, type: "tender", tenderId: tender._id}).$promise.then(function(res) {
        $scope.documents = res;
        $scope.tender = tender;
        $scope.assignees = [];
        _.each(tender.members, function(member) {
            if (member.user) {
                $scope.assignees.push(member.user);
            } else {
                $scope.assignees.push({email: member.email});
            }
        });
    });
});