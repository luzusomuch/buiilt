angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $stateParams, $state, messageService, people, socket, notificationService, dialogService, tenderService, tenders) {
	$rootScope.title = $rootScope.project.name +" Tenders";
    $scope.dialogService = dialogService;
    $scope.tenders = tenders;
    $scope.selectedFilterEventsList = [];
    $scope.selectedFilterTenderersList = [];

    /*Show modal with valid name*/
    $scope.showModal = function(modalName) {
        $mdDialog.show({
            controller: 'projectTendersCtrl',
            resolve: {
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.getAll({id: $stateParams.id}).$promise;
                }]
            },
            templateUrl: 'app/modules/project/project-tenders/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.addNewTender = function() {
        if (!checkAllowCreateTender()) {
            dialogService.showToast("Not Allow To Excute This Function");
        } else {
            var data = {project: $rootScope.project};
            tenderService.create(data).$promise.then(function(res) {
                dialogService.closeModal();
                dialogService.showToast("Add New Tender Successfully");
                $state.go("project.tenders.detail", {id: res.project, tenderId: res._id});
            }, function(err) {
                dialogService.showToast("Error");
            });
        }
    };

    // Only need to check architect and builder team
    function checkAllowCreateTender() {
        var allow = false;
        if (people.builders.length > 0 && people.builders[0].hasSelect) {
            if (people.builders[0].tenderers[0]._id && people.builders[0].tenderers[0]._id._id==$rootScope.currentUser._id) {
                allow = true;
            }
        } else if (people.architects.length > 0 && people.architects[0].hasSelect) {
            if (people.architects[0].tenderers[0]._id && people.architects[0]._id._id==$rootScope.currentUser._id) {
                allow = true;
            }
        }
        return allow;
    };
    $scope.allowCreateNewTender = checkAllowCreateTender();


    socket.on("tender:new", function(data) {
        if (data.project==$stateParams.id) {
            $scope.tenders.push(data);
        }
    });
}); 