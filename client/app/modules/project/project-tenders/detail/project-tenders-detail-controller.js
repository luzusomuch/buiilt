angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, peopleService, $mdToast, tender, $mdDialog, $state) {
    $scope.tender = tender;
    $rootScope.title = $scope.tender.tenderName + " detail";

    function getTenderers() {
        $scope.tenderers = [$scope.tender.inviter];
        _.each($scope.tender.tenderers, function(tenderer) {
            if (tenderer._id) {
                $scope.tenderers.push(tenderer._id);
            } else {
                $scope.tenderers.push({email:tenderer.email});
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
                $state.go("project.team", {id: $stateParams.id});
            }, function(err) {
                $scope.showToast("Something went wrong!");
            });
        }, function() {
            
        });
    };

    $scope.distributeTender = function() {
        peopleService.updateDistributeStatus({id: $stateParams.id, tenderId: $stateParams.tenderId}).$promise.then(function(res) {
            $scope.showToast("Edit distribute status successfully");
            $scope.tender.isDistribute = !$scope.tender.isDistribute;
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.selectMember = function(index) {
        $scope.tenderers[index].select = !$scope.tenderers[index].select;
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        file.type = "file";
        $scope.addendum.file = file;
    };

    function setAddendum() {
        $scope.addendum = {
            members: []
        }
    };
    setAddendum();
    $scope.sendAddendum = function() {
        $scope.addendum.members = _.filter($scope.tenderers, {select: true});
        if ($scope.addendum.members.length === 0) {
            $scope.showToast("Please select at least 1 tenderer");
            return;
        } else {
            peopleService.attachAddendum({id: $stateParams.id, tenderId: $stateParams.tenderId}, $scope.addendum).$promise.then(function(res) {
                $scope.cancelNewTenderModal();
                $scope.showToast("Attach addendum successfully");
                $rootScope.$broadcast("Tender.Updated", res);
            }, function(err){$scope.showToast("Error");});
        }
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    getTenderers();
    $rootScope.$on("Tender.Updated", function(event, data) {
        $scope.tenderer = data;
    });
});