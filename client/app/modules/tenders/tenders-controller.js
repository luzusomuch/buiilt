angular.module('buiiltApp').controller('TendersCtrl', function($scope, $rootScope, $mdDialog, $mdToast, $stateParams, tenderService, tenders, $state) {
    $rootScope.title = "Tenders List";
    $scope.minDay = new Date();
    $scope.tenders = tenders;

    $rootScope.$on("Tender.Inserted", function(event, data) {
        $scope.tenders.push(data);
    });

    $scope.tender = {};
    $scope.availableProjects = [];
    _.each($rootScope.projects, function(project) {
        if (project.projectManager._id == $rootScope.currentUser._id && project.status==="waiting") {
            $scope.availableProjects.push(project);
        }
    });

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.showCreateTenderModal = function(event) {
        $mdDialog.show({
            targetEvent: event,
            controller: "TendersCtrl",
            resolve: {
                tenders: function(tenderService) {
                    return tenderService.getAll().$promise;
                }
            },
            templateUrl: 'app/modules/tenders/new-tender.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.selectProject = function(index) {
        _.each($scope.availableProjects, function(project) {
            project.select = false;
        });
        $scope.tender.project = $scope.availableProjects[index];
        $scope.availableProjects[index].select = true;
        if ($scope.availableProjects[index].projectManager.type === "builder") {
            $scope.availableUserType = [{value: "subconstractors", text: "Subconstractor"}, {value: "consultants", text: "Consultants"}];
        } else if ($scope.availableProjects[index].projectManager.type === "architect") {
            $scope.availableUserType = [{value: "builders", text: "Builder"}, {value: "consultants", text: "Consultants"}];
        }
    };

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
	
	$scope.cancelDialog = function(){
		$mdDialog.cancel();
	}

});