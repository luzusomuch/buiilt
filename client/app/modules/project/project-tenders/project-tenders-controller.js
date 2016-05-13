angular.module('buiiltApp').controller('projectTendersCtrl', function($rootScope, $scope, $timeout, $mdDialog, $stateParams, $state, messageService, people, socket, notificationService, dialogService, tenderService, tenders) {
	$rootScope.title = $rootScope.project.name +" Tenders";
    $scope.dialogService = dialogService;
    $scope.tenders = tenders;
    $scope.status = 'open';
    var selectedFilterEventsList = [];
    var selectedFilterTenderersList = [];

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
        if (people.builders.length > 0 && people.builders[0].hasSelect) {
            if (people.builders[0].tenderers[0]._id && people.builders[0].tenderers[0]._id._id.toString()===$rootScope.currentUser._id.toString()) {
                return true;
            }
        }
        if (people.architects.length > 0 && people.architects[0].hasSelect) {
            if (people.architects[0].tenderers[0]._id && people.architects[0].tenderers[0]._id._id.toString()===$rootScope.currentUser._id.toString()) {
                return true;
            }
        }
    };
    $scope.allowCreateNewTender = checkAllowCreateTender();

    function tenderInitial() {
        $scope.tenderers = [];
        $scope.events = [];
        _.each($scope.tenders, function(tender) {
            // Get all tenderers of tenders list
            _.each(tender.members, function(member) {
                if ((member.email&&member.name) || member.user) {
                    if (member.user) {
                        $scope.tenderers.push(member.user);
                    } else {
                        $scope.tenderers.push({email: member.email, phoneNumber: member.phoneNumber, name: member.name});
                    }
                }
            });
            // Get all events of tenders list
            if (tender.event) {
                $scope.events.push(tender.event);
            }
        });

        // get unique tenderers and events
        $scope.tenderers = _.uniq($scope.tenderers, "email");
        $scope.events = _.uniq($scope.events, "_id");
    };
    tenderInitial();

    $scope.changeFilter = function(type, isCheckAll, filterValue) {
        if (type==="tenderer") {
            if (isCheckAll) {
                _.each($scope.tenderers, function(tenderer) {
                    tenderer.select = false;
                });
            } else {
                var index = _.findIndex($scope.tenderers, function(tenderer) {
                    return tenderer.email===filterValue;
                });
                if (index !== -1) {
                    $scope.tenderers[index].select = !$scope.tenderers[index].select;
                }
            }
            selectedFilterTenderersList = _.filter($scope.tenderers, {select: true});
        } else if (type==="event") {
            if (isCheckAll) {
                _.each($scope.events, function(ev) {
                    ev.select = false;
                });
            } else {
                var index = _.findIndex($scope.events, function(ev) {
                    return ev._id.toString()===filterValue.toString();
                });
                if (index !== -1) {
                    $scope.events[index].select = !$scope.events[index].select;
                }
            }
            selectedFilterEventsList = _.filter($scope.events, {select: true});
        }
    };

    $scope.search = function(tender) {
        var found = false;
        if (selectedFilterEventsList.length > 0 && selectedFilterTenderersList.length > 0) {
            if (tender.status===$scope.status && tender.event && tender.members.length > 0) {
                _.each(selectedFilterEventsList, function(ev) {
                    if (tender.event && tender.event._id==ev._id) {
                        _.each(selectedFilterTenderersList, function(tenderer) {
                            if (_.findIndex(tender.members, function(member) { 
                                if (member.user)  
                                    return member.user.email==tenderer.email;
                                else
                                    return member.email==tenderer.email;
                            }) !== -1) {
                                if ($scope.name && $scope.name.trim().length > 0) {
                                    if (tender.name && tender.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                        found = true;
                                    } 
                                } else {
                                    found = true;
                                }
                                return false;
                            }
                        });
                    }
                });
            }
        } else if (selectedFilterEventsList.length > 0) {
            if (tender.status===$scope.status && tender.event) {
                _.each(selectedFilterEventsList, function(ev) {
                    if (tender.event._id==ev._id) {
                        if ($scope.name && $scope.name.trim().length > 0) {
                            if (tender.name && tender.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                found = true;
                            }
                        } else {
                            found = true
                        }
                        return false;
                    }
                });
            }
        } else if (selectedFilterTenderersList.length > 0) {
            if (tender.status===$scope.status && tender.members.length > 0) {
                _.each(selectedFilterTenderersList, function(tenderer) {
                    if (_.findIndex(tender.members, function(member) { 
                        if (member.user)  
                            return member.user.email==tenderer.email;
                        else
                            return member.email==tenderer.email;
                    }) !== -1) {
                        if ($scope.name && $scope.name.trim().length > 0) {
                            if (tender.name && tender.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                                found = true;
                            }
                        } else {
                            found = true;
                        }
                        return false;
                    }
                });
            }
        } else if (selectedFilterTenderersList.length===0 && selectedFilterEventsList.length===0) {
            if (tender.status===$scope.status) {
                if ($scope.name && $scope.name.trim.length > 0) {
                    if (tender.name && tender.name.toLowerCase().indexOf($scope.name.toLowerCase()) !== -1) {
                        found = true;
                    }
                } else {
                    found = true;
                }
            }
        }
        return found;
    };

    socket.on("tender:new", function(data) {
        if (data.project==$stateParams.id) {
            $scope.tenders.push(data);
        }
    });
}); 