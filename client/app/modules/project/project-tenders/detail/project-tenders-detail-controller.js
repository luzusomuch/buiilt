angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, $mdDialog, $state, socket, notificationService, tender, dialogService, tenderService, contactBooks) {
    $scope.dialogService = dialogService;
    $scope.currentUser = $rootScope.currentUser;
    $scope.tender = tender;
    $scope.contactBooks = contactBooks;
    $scope.tender.name = ($scope.tender.name) ? $scope.tender.name : "Please Enter Your Tender Name";
    var originalTenderName = angular.copy($scope.tender.name);

    $scope.showSaveTitleBtn = false;
    $scope.$watch("tender.name", function(value) {
        if (originalTenderName !== value) {
            $scope.showSaveTitleBtn = true;
        }
    });

    /*Get invitees list from contact book that haven't in the current
    tender member list*/
    function getInviteesMayInvite() {
        _.each($scope.tender.members, function(member) {
            var index = _.findIndex($scope.contactBooks, function(contact) {
                if (member.user) {
                    return member.user.email==contact.email || member.user.phoneNumber==contact.phoneNumber
                } else {
                    return member.email==contact.email || member.phoneNumber==contact.phoneNumber;
                }
            });
            if (index !== -1) {
                $scope.contactBooks.splice(index, 1);
            }
        });
    };
    getInviteesMayInvite();

    socket.emit("join", tender._id);

    socket.on("tender:update", function(data) {
        $scope.tender = data;
        originalTenderName = $scope.tender.name;
    });

    $scope.selectItem = function(index, type) {
        if (type==="contact") 
            $scope.contactBooks[index].select = !$scope.contactBooks[index].select;
    };

    /*Show modal with valid name*/
    $scope.showModal = function(modalName) {
        $mdDialog.show({
            controller: 'projectTendersDetailCtrl',
            resolve: {
                tender: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }],
                contactBooks: ["contactBookService", function(contactBookService) {
                    return contactBookService.me().$promise;
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

    $scope.inviteTenderer = function() {
        $scope.tender.newMembers = _.filter($scope.contactBooks, {select: true});
        if ($scope.tender.newMembers.length > 0) {
            $scope.tender.editType="invite-tenderer";
            $scope.update($scope.tender);
        } else {
            dialogService.showToast("Please Select At Least 1 Invitee");
        }
    };

    $scope.addScopeOrAddendum = function() {
        console.log($scope.addScope, $scope.addAddendum);
        if ($scope.addScope) {
            if ($scope.tender.isCreateScope) {
                dialogService.showToast("You Already Created Scope FOr This Tender");
            } else {
                if ($scope.tender.scope.trim().length > 0) {
                    $scope.tender.editType="add-scope";
                    $scope.update($scope.tender);
                } else {
                    dialogService.showToast("Check Your Input");
                }
            }
        } else if ($scope.addAddendum) {
            if ($scope.tender.isCreateScope) {
                if ($scope.tender.addendum.trim().length > 0) {
                    $scope.tender.editType="add-addendum";
                    $scope.update($scope.tender);
                } else {
                    dialogService.showToast("Check Your Input");
                }
            } else {
                dialogService.showToast("Not Allow To Add Addendum When Haven't Got Scope");
            }
        }
    };

    $scope.update = function(tender) {
        tenderService.update({id: tender._id}, tender).$promise.then(function(res) {
            dialogService.closeModal();
            if (tender.editType==="change-title") {
                dialogService.showToast("Changed Tender Title Successfully");
                $scope.showSaveTitleBtn = false;
            } else if (tender.editType==="invite-tenderer") 
                dialogService.showToast("Invite More Tenderer Successfully");
        }, function(err) {
            dialogService.showToast("Error");
        });
    };

});