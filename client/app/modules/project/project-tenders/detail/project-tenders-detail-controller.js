angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, $mdDialog, $state, socket, notificationService, tender, dialogService, tenderService) {
    $scope.dialogService = dialogService;
    $scope.tender = tender;
    $scope.tender.name = ($scope.tender.name) ? $scope.tender.name : "Please Enter Your Tender Name";
    var originalTenderName = angular.copy($scope.tender.name);

    $scope.showSaveTitleBtn = false;
    $scope.$watch("tender.name", function(value) {
        if (originalTenderName !== value) {
            $scope.showSaveTitleBtn = true;
        }
    });

    socket.emit("join", tender._id);

    socket.on("tender:updated", function(data) {
        $scope.tender = data;
        originalTenderName = $scope.tender.name;
    });

    /*Show modal with valid name*/
    $scope.showModal = function(modalName) {
        $mdDialog.show({
            controller: 'projectTendersDetailCtrl',
            resolve: {
                tender: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-tenders/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.changeTitle = function() {
        $scope.tender.editType="change-title";
        $scope.update($scope.tender);
    };

    $scope.update = function(tender) {
        tenderService.update({id: tender._id}, tender).$promise.then(function(res) {
            dialogService.closeModal();
            if (tender.editType==="change-title") {
                dialogService.showToast("Changed Tender Title Successfully");
                $scope.showSaveTitleBtn = false;
            }
        }, function(err) {
            dialogService.showToast("Error");
        });
    };

});