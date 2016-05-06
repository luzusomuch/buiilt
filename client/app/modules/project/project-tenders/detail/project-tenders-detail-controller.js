angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, $mdDialog, $state, socket, notificationService, tender, dialogService, tenderService, contactBooks, people, documentSets, activities) {
    $scope.dialogService = dialogService;
    $scope.currentUser = $rootScope.currentUser;
    var originalTender = angular.copy(tender);
    $scope.tender = tender;
    $scope.tender.selectedEvent = tender.event;
    $scope.contactBooks = contactBooks;
    $scope.documentSets = documentSets;
    $scope.events = [];
    _.each(activities, function(activity) {
        if (!activity.isMilestone) {
            $scope.events.push(activity);
        }
    });
    $scope.tender.name = ($scope.tender.name) ? $scope.tender.name : "Please Enter Your Tender Name";

    $scope.showSaveTitleBtn = false;
    $scope.$watch("tender.name", function(value) {
        if (originalTender.name !== value) {
            $scope.showSaveTitleBtn = true;
        }
    });

    /*Get invitees list from contact book that haven't in the current
    tender member list*/
    function getInviteTypeAndCheckInviteesMayInvite() {
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
        $scope.availableInviteType = [
            {value: "builders", text: "Builder"},
            {value: "subconstractors", text: "Sub constractor"},
            {value: "consultants", text: "Consultants"}
        ];
        if (people.builders[0] && people.builders[0].hasSelect) {
            $scope.availableInviteType.splice(0, 1);
        }
        if ($scope.tender.ownerType==="architects") {
            var subconstractorIndex = _.findIndex($scope.availableInviteType, function(type) {
                return type.value==="subconstractors";
            });
            $scope.availableInviteType.splice(subconstractorIndex, 1);
        }
    };
    getInviteTypeAndCheckInviteesMayInvite();

    socket.emit("join", tender._id);

    socket.on("tender:update", function(data) {
        $scope.tender = data;
        $scope.tender.selectedEvent = data.event;
        originalTender = $scope.tender;
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
                }],
                people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                    return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                }],
                documentSets: ["$stateParams", "documentService", function($stateParams, documentService) {
                    return documentService.me({id: $stateParams.id}).$promise;
                }],
                activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                    return activityService.me({id: $stateParams.id}).$promise;
                }],
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
        if (!$scope.tender.type && !$scope.tender.selectedTenterType) {
            dialogService.showToast("Please select tender type first");
        } else {
            $scope.tender.newMembers = _.filter($scope.contactBooks, {select: true});
            if ($scope.tender.newMembers.length > 0) {
                $scope.tender.editType="invite-tenderer";
                $scope.update($scope.tender);
            } else {
                dialogService.showToast("Please Select At Least 1 Invitee");
            }
        }
    };

    $scope.addScopeOrAddendum = function() {
        if ($scope.addScope) {
            if ($scope.tender.isCreateScope) {
                dialogService.showToast("You Already Created Scope FOr This Tender");
            } else {
                if ($scope.tender.scope.trim().length > 0) {
                    $scope.tender.editType="attach-scope";
                    $scope.update($scope.tender);
                } else {
                    dialogService.showToast("Check Your Input");
                }
            }
        } else if ($scope.addAddendum) {
            if ($scope.tender.isCreateScope) {
                if ($scope.tender.addendum.trim().length > 0) {
                    $scope.tender.editType="attach-addendum";
                    $scope.update($scope.tender);
                } else {
                    dialogService.showToast("Check Your Input");
                }
            } else {
                dialogService.showToast("Not Allow To Add Addendum When Haven't Got Scope");
            }
        }
    };

    $scope.eventOrDocumentSetChangeArray = [];
    $scope.changeEventOrDocumentSet = function(type) {
        var editType = type;
        if (type==="event" && $scope.tender.event) {
            editType = "change-event";
        } else if (type==="event" && !$scope.tender.event) {
            editType = "add-event";
        }
        var index = $scope.eventOrDocumentSetChangeArray.indexOf(editType);
        if (index === -1) {
            $scope.eventOrDocumentSetChangeArray.push(editType);
        }
    };

    $scope.changeDetail = function() {
        _.each($scope.eventOrDocumentSetChangeArray, function(editType) {
            $scope.tender.editType=editType;
            $scope.update($scope.tender);
        });
    };

    $scope.selectWinner = function() {
        if (!isNaN($scope.tender.winnerIndex)) {
            $mdDialog.show($mdDialog.confirm()
                .title("Do you want to select this tenderer as winner?") 
                .content("Select "+($scope.tender.members[$scope.tender.winnerIndex].user) ? $scope.tender.members[$scope.tender.winnerIndex].user.name : $scope.tender.members[$scope.tender.winnerIndex].name +" to be winner") 
                .ariaLabel("Select Winner")
                .ok("Sure")
                .cancel("Cancel")
            ).then(function() {
                $scope.tender.editType="select-winner";
                $scope.update($scope.tender);
            }, function() {

            });
        } else {
            dialogService.showToast("Please Select A Tenderer");
        }
    };

    $scope.update = function(tender) {
        if (tender.status==="close") {
            dialogService.showToast("This tender has closed");
            return;
        }
        tenderService.update({id: tender._id}, tender).$promise.then(function(res) {
            dialogService.closeModal();
            if (tender.editType==="change-title") {
                dialogService.showToast("Changed Tender Title Successfully");
                $scope.showSaveTitleBtn = false;
            } else if (tender.editType==="invite-tenderer") 
                dialogService.showToast("Invite More Tenderer Successfully");
            else if (tender.editType==="attach-addendum") 
                dialogService.showToast("Attach Addendum Successfully");
            else if (tender.editType==="attach-scope") 
                dialogService.showToast("Attach Scope Successfully");
            else if (tender.editType==="attach-document-set")
                dialogService.showToast("Attach Document Set Successfully");
            else if (tender.editType==="add-event" || tender.editType==="change-event") {
                dialogService.showToast((tender.editType==="add-event") ? "Add Event Successfully" : "Changed Event Successfully");
            } else if (tender.editType==="select-winner") {
                dialogService.showToast("Select Winner Successfully");
            }
        }, function(err) {
            dialogService.showToast("Error");
        });
    };

});