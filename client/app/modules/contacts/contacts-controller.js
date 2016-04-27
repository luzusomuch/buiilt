angular.module('buiiltApp').controller('contactsCtrl', function($rootScope, $scope, $timeout, $state, $mdDialog, $state, userService, dialogService, contactBookService, contactBooks) {
    $scope.dialogService = dialogService;
    $rootScope.title = "Contacts Book"
    $scope.contactBooks = contactBooks;

    if ($rootScope.isCreateNewContact) {
        console.log("AAAAAAAAAAa");
        $scope.showModal("add-new-contact.html");
    };

    /*Show modal with valid name*/
    $scope.showModal = function(name) {
        $rootScope.isCreateNewContact = null;
        // $rootScope.editUserType = type;
        $mdDialog.show({
            // targetEvent: $event,
            controller: 'contactsCtrl',
            templateUrl: 'app/modules/settings/partials/'+name,
            resolve: {
                contactBooks: ["contactBookService", function(contactBookService) {
                    return contactBookService.me().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Check for next function when click next in modal*/
    $scope.step = 1;
    $scope.newContact = {};
    $scope.searchNewContact = {};
    $scope.next = function(type) {
        if ($scope.step==1) {
            if (type==="addContact") {
                if (!$scope.searchNewContact.email || !$scope.searchNewContact.phoneNumber)
                    dialogService.showToast("Please Insert At Least 1 Contact");
                else {
                    userService.getAll({email: $scope.searchNewContact.email, phoneNumber: $scope.searchNewContact.phoneNumber}).$promise.then(function(res) {
                        $scope.searchUsers = res;
                        $scope.step += 1;
                        var index = _.findIndex($scope.searchUsers, function(user) {
                            return user.email===$scope.searchNewContact.email;
                        });
                        if (index === -1) {
                            $scope.showSearchResult = true;
                        }
                    }, function(err) {
                        $scope.searchUsers = [];
                        $scope.step += 1;
                    });
                }
            } else {
                $scope.step += 1;
            }
        }
    };

    $scope.removeContact = function(index, type) {
        if (type === "newContact") {
            $scope.newContact.contacts.splice(index ,1);
        }
    };

    $scope.addContact = function() {
        if (!$scope.selectedContact && !$scope.selectedNewContact) {
            dialogService.showToast("Please enter at least 1 contact");
        } else {
            $scope.newContact.contacts = [];
            if ($scope.selectedNewContact) {
                if (!$scope.selectedNewContact.firstName || !$scope.selectedNewContact.lastName || !$scope.selectedNewContact.teamName) {
                    dialogService.showToast("Check your new contact input");
                    return;
                } else {
                    $scope.newContact.contacts.push($scope.selectedNewContact);
                }
            }
            if ($scope.selectedContact) {
                $scope.newContact.contacts.push($scope.selectedContact);
            }
            contactBookService.create({}, $scope.newContact).$promise.then(function(res) {
                $rootScope.$emit("addContact", res);
                dialogService.closeModal();
                dialogService.showToast("Added New Contacts Successfully");
                $rootScope.isCreateNewContact = null;
            }, function(err) {
                dialogService.showToast("Error");
            });
        }
    };

    $scope.$on('$destroy', function() {
        listenAddContact();
    });

    var listenAddContact = $rootScope.$on("addContact", function(ev, data) {
        $scope.contactBooks = _.union($scope.contactBooks, data);
    });

});