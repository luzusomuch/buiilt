angular.module('buiiltApp').controller('contactsCtrl', function($rootScope, $scope, $timeout, $state, $mdDialog, $state, userService, dialogService, contactBookService, contactBooks) {
    $scope.dialogService = dialogService;
    $rootScope.title = "Contacts Book"
    $scope.contactBooks = contactBooks;

    $scope.isCreateNewContact = $rootScope.isCreateNewContact;
    if ($scope.isCreateNewContact) {
        $mdDialog.show({
            // targetEvent: $event,
            controller: 'contactsCtrl',
            templateUrl: 'app/modules/contacts/partials/add-new-contact.html',
            resolve: {
                contactBooks: ["contactBookService", function(contactBookService) {
                    return contactBookService.me().$promise;
                }]
            },
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
        $rootScope.isCreateNewContact = null;
    }

    /*Show modal with valid name*/
    $scope.showModal = function(name) {
        $mdDialog.show({
            // targetEvent: $event,
            controller: 'contactsCtrl',
            templateUrl: 'app/modules/contacts/partials/'+name,
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
                        // var index = _.findIndex($scope.searchUsers, function(user) {
                        //     return user.email===$scope.searchNewContact.email;
                        // });
                        // if (index === -1) {
                        //     $scope.showSearchResult = true;
                        // }
                        _.each($scope.contactBooks, function(contact) {
                            // remove search result when it already existed in contacts book
                            var index = _.findIndex($scope.searchUsers, function(user) {
                                return contact.email==user.email && contact.phoneNumber==user.phoneNumber;
                            });
                            if (index !== -1) {
                                $scope.searchUsers.splice(index, 1);
                            }
                        });
                        $scope.selectedNewContact = $scope.searchUsers.length;
                    }, function(err) {
                        $scope.searchUsers = [];
                        $scope.selectedNewContact = $scope.searchUsers.length;
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
        if (!$scope.selectedContact && $scope.selectedNewContact !== 0) {
            dialogService.showToast("Please enter at least 1 contact");
        } else {
            $scope.newContact.contacts = [];
            if ($scope.selectedNewContact === 0) {
                if (!$scope.searchNewContact.firstName || !$scope.searchNewContact.lastName) {
                    dialogService.showToast("Check your new contact input");
                    return;
                } else {
                    $scope.newContact.contacts.push($scope.searchNewContact);
                }
            }
            if ($scope.selectedContact) {
                $scope.newContact.contacts.push($scope.selectedContact);
            }
            var allowInsert = true;
            _.each($scope.newContact.contacts, function(contact) {
                var index = _.findIndex($scope.contactBooks, function(ctBook) {
                    return contact.email==ctBook.email || contact.phoneNumber==ctBook.phoneNumber;
                });
                if (index !== -1) {
                    allowInsert = false;
                    return false;
                }
            });
            if (!allowInsert) {
                dialogService.showToast("Your new contact is already existed");
                return
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