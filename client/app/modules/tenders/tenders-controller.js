angular.module('buiiltApp').controller('TendersCtrl', function($scope, $rootScope, $mdDialog, $mdToast, $stateParams, tenderService, tenders, $state) {
    $rootScope.title = "Tenders List";
    $scope.minDay = new Date();
    $scope.tenders = tenders;

    // filter section
    $scope.name = null;
    $scope.invitee = null;
    $scope.weekTags = [{text: "this week", value: "this"}, {text: "next week", value: "next"}];
    $scope.statusTags = [{text: "to be distributed", value: false}, {text: "distributed", value: true}];
    $scope.selectedStatus = [];
    $scope.selectedWeek = [];

    $scope.selectDueDate = function(dateEnd) {
        $scope.dateEnd = dateEnd;
        $scope.selectedStatus = [];
        $scope.selectedWeek = [];
        _.each($scope.statusTags, function(status) {
            status.select = false;
        });
        _.each($scope.weekTags, function(week) {
            week.select = false;
        });
    };

    $scope.selectTag = function(index, type) {
        $scope.dateEnd = null;
        if (type === "status") {
            _.each($scope.weekTags, function(week) {
                week.select = false;
            });
            $scope.selectedWeek = [];
            $scope.statusTags[index].select = !$scope.statusTags[index].select;
            if ($scope.statusTags[index].select) {
                $scope.selectedStatus.push($scope.statusTags[index].value);
            } else {
                $scope.selectedStatus.splice(_.indexOf($scope.selectedStatus, $scope.statusTags[index].value), 1);
            }
        } else {
            _.each($scope.statusTags, function(status) {
                status.select = false;
            });
            $scope.selectedStatus = [];
            $scope.weekTags[index].select = !$scope.weekTags[index].select;
            if ($scope.weekTags[index].select) {
                $scope.selectedWeek.push($scope.weekTags[index].value);
            } else {
                $scope.selectedWeek.splice(_.indexOf($scope.selectedWeek, $scope.weekTags[index].value), 1);
            }
        }
    };

    $scope.search = function(tender) {
        var found = false;
        if ($scope.name && $scope.name.length > 0) {
            if (tender.name && (tender.name.toLowerCase().indexOf($scope.name) > -1 || tender.name.indexOf($scope.name) > -1)) {
                found = true;
            }
            return found;
        } else if ($scope.invitee && $scope.invitee.length > 0) {
            if (tender.members.length > 0) {
                _.each(tender.members, function(member) {
                    if ((member._id && (member._id.name.toLowerCase().indexOf($scope.invitee) > -1 || member._id.name.indexOf($scope.invitee) > -1)) || (member.email && member.email.toLowerCase().indexOf($scope.invitee) > -1)) {
                        found = true;
                    }
                });
            }
            return found;
        } else if ($scope.selectedStatus && $scope.selectedStatus.length > 0) {
            _.each($scope.selectedStatus, function(status) {
                if (tender.isDistribute === status) {
                    found = true;
                }
            });
            return found;
        } else if ($scope.dateEnd) {
            if (tender.dateEnd && moment(moment($scope.dateEnd).format("YYYY-MM-DD")).isSame(moment(tender.dateEnd).format("YYYY-MM-DD"))) {
                found = true;
            }
            return found;
        } else if ($scope.selectedWeek && $scope.selectedWeek.length > 0) {
            var thisWeekStartDate, thisWeekEndDate, nextWeekStartDate, nextWeekEndDay;
            var tenderDateEnd = moment(tender.dateEnd).format("YYYY-MM-DD");
            _.each($scope.selectedWeek, function(week) {
                if (week === "this") {
                    thisWeekStartDate = moment().startOf('week').format("YYYY-MM-DD");
                    thisWeekEndDate = moment().endOf('week').format("YYYY-MM-DD");
                    if (moment(tenderDateEnd).isSameOrAfter(thisWeekStartDate) && moment(tenderDateEnd).isSameOrBefore(thisWeekEndDate)) {
                        found = true;
                    }
                } else {
                    nextWeekStartDate = moment().startOf("week").add(7, "days").format("YYYY-MM-DD");
                    nextWeekEndDay = moment().endOf("week").add(7, "days").format("YYYY-MM-DD");
                    if (moment(tenderDateEnd).isSameOrAfter(nextWeekStartDate) && moment(tenderDateEnd).isSameOrBefore(nextWeekEndDay)) {
                        found = true;
                    }
                }
            });
            return found;
        } else {
            return true;
        }
    };
    // end filter section

    /*Receive when owner inserted new tender*/
    $rootScope.$on("Tender.Inserted", function(event, data) {
        $scope.tenders.push(data);
    });

    $scope.tender = {};
    $scope.availableProjects = [];
    /*Get available project which project manager is current user 
    and project status is waiting*/
    _.each($rootScope.projects, function(project) {
        if (project.projectManager._id == $rootScope.currentUser._id && project.status==="waiting") {
            $scope.availableProjects.push(project);
        }
    });

    /*Show toast dialog*/
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    /*Show create new tender modal*/
    $scope.showCreateTenderModal = function(event) {
        $mdDialog.show({
            targetEvent: event,
            controller: "TendersCtrl",
            resolve: {
                tenders: ["tenderService", function(tenderService) {
                    return tenderService.getAll().$promise;
                }]
            },
            templateUrl: 'app/modules/tenders/new-tender.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Get available type when create new tender
    belong to this project manager type*/
    $scope.selectProject = function(index) {
        _.each($scope.availableProjects, function(project) {
            project.select = false;
        });
        $scope.tender.project = $scope.availableProjects[index];
        $scope.availableProjects[index].select = true;
        if ($scope.availableProjects[index].projectManager.type === "builder") {
            $scope.availableUserType = [{value: "subcontractors", text: "Subconstractor"}, {value: "consultants", text: "Consultants"}];
        } else if ($scope.availableProjects[index].projectManager.type === "architect") {
            $scope.availableUserType = [{value: "builders", text: "Builder"}, {value: "consultants", text: "Consultants"}];
        }
    };

    /*Create new tender then go to this tender detail*/
    $scope.createNewTender = function(form) {
        if (form.$valid) {
            if (!$scope.tender.project) {
                $scope.showToast("Please choose project");
                return;
            } else if (!$scope.tender.type) {
                $scope.showToast("Please choose tender type");
                return;
            } else {
                tenderService.create({},$scope.tender).$promise.then(function(res) {
                    $mdDialog.cancel();
                    $rootScope.$broadcast("Tender.Inserted", res);
                    $scope.showToast("Insert new tender successfully");
                    $state.go("tender.overview", {tenderId: res._id});
                }, function(err){$scope.showToast("Error");});
            }
        } else {
            $scope.showToast("Please check your input again");
        }
    };
	
    /*Close opening modal*/
	$scope.cancelDialog = function(){
		$mdDialog.cancel();
	}

});