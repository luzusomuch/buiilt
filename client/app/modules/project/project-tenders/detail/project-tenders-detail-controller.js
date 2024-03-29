angular.module('buiiltApp').controller('projectTendersDetailCtrl', function($q, $rootScope, $scope, $timeout, $stateParams, $mdDialog, $state, socket, notificationService, tender, dialogService, tenderService, contactBooks, people, documentSets, activities) {
    $scope.contentHeight = $rootScope.maximunHeight - $("header").innerHeight();
    
    $scope.dialogService = dialogService;
    $scope.currentUser = $rootScope.currentUser;
    var originalTender = angular.copy(tender);
    $scope.tender = tender;
    $scope.tender.selectedEvent = tender.event;
    $scope.tender.documentSetSelected = tender.documentSet;
    $scope.tender.newMembers = [];
    $scope.contactBooks = contactBooks;
    $scope.documentSets = documentSets;
    $scope.activities = activities;
	$scope.showDetail = false;

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
            clickOutsideToClose: false,
            escapeToClose: false
        });
    };

    /*Close opening modal*/
    $scope.closeModal = function() {
        if ($rootScope.firstTimeEdit)
            tenderService.delete({id: tender._id}).$promise.then(function() {
                dialogService.closeModal();
                dialogService.showToast("Tender Has Been Removed.");
                $rootScope.$emit("Tender.Remove", tender._id);
                $state.go("project.tenders.all", {id: $stateParams.id});
            }, function(err) {
                dialogService.showToast("There Has Been An Error...");
            });
        else 
            dialogService.closeModal();
    };

    if ($rootScope.openDetail) {
        $rootScope.openDetail = null;
        $rootScope.firstTimeEdit = true;
        $scope.showModal("edit-tender.html");
    }

    $scope.step =1;
    $scope.next = function(type) {
        if (type==="edit-tender") {
            if ($scope.step==1 && (!$scope.tender.name || !$scope.tender.selectedEvent)) {
                dialogService.showToast("Please Provide a Tender Name and Event...");
            } else if ($scope.step==2 && !$scope.tender.isAddScopeLater && !$scope.tender.scope) {
                dialogService.showToast("Please Provide a Scope...");
            } else {
                $scope.step+=1;
            }
        }
    };

    $scope.editTenderAfterCreate = function() {
        if (!$scope.tender.isAddDocumentSetLater && !$scope.tender.documentSetSelected) {
            dialogService.showToast("Please Attach a Document Set...");
        } else {
            var prom = [];
            if (originalTender.name!==$scope.tender.name) {
                $scope.tender.editType="change-title";
                var editTender = angular.copy($scope.tender);
                delete editTender.documentSetSelected;
                prom.push(tenderService.update({id: tender._id}, editTender).$promise);
            } 

            if ($scope.tender.selectedEvent) {
                $scope.tender.editType = "add-event";
                var editTender = angular.copy($scope.tender);
                delete editTender.documentSetSelected;
                prom.push(tenderService.update({id: tender._id}, editTender).$promise);
            }

            if (!$scope.tender.isAddScopeLater && $scope.tender.scope.trim().length > 0) {
                $scope.tender.editType = "attach-scope";
                var editTender = angular.copy($scope.tender);
                delete editTender.documentSetSelected;
                prom.push(tenderService.update({id: tender._id}, editTender).$promise);
            }

            if (!$scope.tender.isAddDocumentSetLater && $scope.tender.documentSetSelected) {
                $scope.tender.editType = "attach-document-set";
                var editTender = angular.copy($scope.tender);
                prom.push(tenderService.update({id: tender._id}, editTender).$promise);
            }
            if (prom.length > 0) {
                $q.all(prom).then(function() {
                    dialogService.showToast("Tender Has Been Updated Successfully.");
                    dialogService.closeModal();
                }, function() {
                    dialogService.showToast("There Has Been An Error...");
                });
            }
        }
    };

    /*Get invitees list from contact book that haven't in the current
    tender member list*/
    function getInviteTypeAndCheckInviteesMayInvite() {
        // remive current members of this tender from contact books
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
        // remove project members from contact books
        var projectMembers = $rootScope.getProjectMembers(people);
        _.each(projectMembers, function(member) {
            var index = _.findIndex($scope.contactBooks, function(contact) {
                return member.email==contact.email || member.phoneNumber==contact.phoneNumber;
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
        // if (people.builders[0] && people.builders[0].hasSelect) {
        //     $scope.availableInviteType.splice(0, 1);
        // }
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
        originalTender = angular.copy(data);
        $scope.tender = data;
        $scope.tender.selectedEvent = data.event;
        $scope.tender.documentSetSelected = data.documentSet;
    });

    $scope.selectItem = function(index, type) {
        if (type==="contact") 
            $scope.contactBooks[index].select = !$scope.contactBooks[index].select;
    };

    $scope.querySearch = function(query) {
        var result = query ? $scope.contactBooks.filter(function(contact) {
            return contact.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
        }) : [];
        return result;
    };

    $scope.tenderer = {};
    $scope.$watch("selectedItem", function(value) {
        if (value) {
            $scope.tenderer.name = value.name;
            $scope.tenderer.email = value.email;
            $scope.tenderer.phoneNumber = value.phoneNumber;
        }
    });

    $scope.addNewTenderer = function(invitee) {
        var index = _.findIndex($scope.tender.newMembers, function(member) {
            return member.email===invitee.email && member.phoneNumber==invitee.phoneNumber;
        });
        if (index === -1) {
            $scope.tender.newMembers.push(invitee);
            $scope.tenderer = {};
            $scope.searchText = null;
        } else {
            dialogService.showToast("Tenderer Has Been Added.");
        }
    };

    $scope.removeTenderer = function(index) {
        $scope.tender.newMembers.splice(index, 1);
    };

    $scope.inviteTenderer = function() {
        if (!$scope.tender.type && !$scope.tender.selectedTenterType) {
            dialogService.showToast("Please Provide a Tender Type...");
        } else {
            var index = _.findIndex($scope.tender.newMembers, function(member) {
                return member.email===$scope.tenderer.email && member.phoneNumber==$scope.tenderer.phoneNumber;
            });
            if (index === -1) {
                $scope.tender.newMembers.push({name: $scope.tenderer.name, email: $scope.tenderer.email, phoneNumber: $scope.tenderer.phoneNumber});
            } else {
                dialogService.showToast("Tenderer Has Been Added.");
                return;
            }
            if ($scope.tender.newMembers.length > 0) {
                $scope.tender.editType="invite-tenderer";
                $scope.update($scope.tender);
            } else {
                dialogService.showToast("Please Add At Least One Tenderer...");
            }
        }
    };

    $scope.changeTitle = function(form) {
        if (form.$valid && $scope.tender.name!==originalTender.name) {
            $scope.tender.editType="change-title";
            $scope.update($scope.tender);
        } else {
            dialogService.showToast("Please Provide another Tender Title...");
        }
    };

    $scope.addScopeOrAddendum = function() {
        if (!$scope.tender.isCreateScope) {
            if ($scope.tender.scope.trim().length > 0) {
                $scope.tender.editType="attach-scope";
                $scope.update($scope.tender);
            } else {
                dialogService.showToast("Please Provide a Tender Scope...");
            }
        } else if ($scope.tender.isCreateScope) {
            if ($scope.tender.addendum.trim().length > 0) {
                $scope.tender.editType="attach-addendum";
                $scope.update($scope.tender);
            } else {
                dialogService.showToast("Please Provide a Tender Addendum...");
            }
        }
    };

    $scope.changeEventOrDocumentSet = function(type) {
        var editType = type;
        if (type==="event" && $scope.tender.event) {
            editType = "change-event";
        } else if (type==="event" && !$scope.tender.event) {
            editType = "add-event";
        }
        $scope.tender.editType = editType;
        $scope.update($scope.tender);
    };

    $scope.selectWinner = function() {
        if (!isNaN($scope.tender.winnerIndex)) {
        var selectWinnerName = ($scope.tender.members[$scope.tender.winnerIndex].user) ? $scope.tender.members[$scope.tender.winnerIndex].user.name : $scope.tender.members[$scope.tender.winnerIndex].name;
            $mdDialog.show($mdDialog.confirm()
                .title("Do you want to select this tenderer as the winner?") 
                .content("Select "+ selectWinnerName +" to be winner") 
                .ariaLabel("Select Winner")
                .ok("Yes")
                .cancel("Cancel")
            ).then(function() {
                $scope.tender.editType="select-winner";
                $scope.update($scope.tender);
            }, function() {

            });
        } else {
            dialogService.showToast("Please Select A Tenderer...");
        }
    };

    $scope.update = function(tender) {
        if (tender.status==="close") {
            dialogService.showToast("This Tender Is Closed.");
            return;
        }
        tenderService.update({id: tender._id}, tender).$promise.then(function(res) {
            dialogService.closeModal();
            if (tender.editType==="change-title") {
                dialogService.showToast("Tender Title Updated Successfully.");
                $scope.save = false;
                $scope.showSaveTitleBtn = false;
            } else if (tender.editType==="invite-tenderer") 
                dialogService.showToast("Tenderers Have Been Invited Successfully.");
            else if (tender.editType==="attach-addendum") 
                dialogService.showToast("Addendum Has Been Attached Successfully.");
            else if (tender.editType==="attach-scope") 
                dialogService.showToast("Scope Has Been Attached Successfully.");
            else if (tender.editType==="attach-document-set")
                dialogService.showToast("Document Set Attached Successfully.");
            else if (tender.editType==="add-event" || tender.editType==="change-event") {
                dialogService.showToast((tender.editType==="add-event") ? "Event Has Been Added Successfully." : "Event Has Been Updated Successfully.");
            } else if (tender.editType==="select-winner") {
                dialogService.showToast("You Have Successfully Selected the Winning Tender.");
            }
        }, function(err) {
            dialogService.showToast("There Has Been An Error...");
        });
    };

});