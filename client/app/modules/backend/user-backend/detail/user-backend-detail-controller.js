angular.module('buiiltApp').controller('UserBackendDetailCtrl', function($rootScope, $scope, tenderService, projectService, $mdDialog, $mdToast, projects, tenders, $stateParams, $state) {
    $scope.datas = _.union(projects, tenders);
    $scope.userId = $stateParams.userId;

    $scope.searchType = [];
    $scope.selectItem = function(type) {
        var index = _.indexOf($scope.searchType, type);
        if (index !== -1) {
            $scope.searchType.splice(index, 1);
        } else {
            $scope.searchType.push(type);
        }
    };

    $scope.search = function(item) {
        var text = $scope.searchText;
        var type = $scope.searchType;
        var found = false;
        if ((text && text.length > 0) && (type.length > 0)) {
            _.each(type, function(t) {
                if ((t === "tender" && item.project) && (item.name.toLowerCase().indexOf(text) > -1 || item.name.indexOf(text) > -1)) {
                    found = true;
                } else if ((t === "project" && !item.project) && (item.name.toLowerCase().indexOf(text) > -1 || item.name.indexOf(text) > -1)) {
                    found = true;
                }
            });
            return found;
        } else if (text && text.length > 0) {
            if (item.name.toLowerCase().indexOf(text) > -1 || item.name.indexOf(text) > -1) {
                found = true;
            }
            return found;
        } else if (type.length > 0) {
            _.each(type, function(t) {
                if (t === "tender" && item.project) {
                    found = true;
                } else if (t === "project" && !item.project) {
                    found = true
                }
            });
            return found;
        } else {
            return true;
        }
    };

    $scope.showModal = function(event, name, item) {
        $rootScope.itemDetail = item;
        $mdDialog.show({
            targetEvent: event,
            controller: 'UserBackendDetailCtrl',
            resolve: {
                projects: ["$stateParams", "projectService", function($stateParams, projectService) {
                    return projectService.getAllProjects({userId: $stateParams.userId}).$promise;
                }],
                tenders: ["$stateParams", "tenderService", function($stateParams, tenderService) {
                    return tenderService.getAll({userId: $stateParams.userId}).$promise;
                }]
            },
            templateUrl: 'app/modules/backend/partials/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
        $rootScope.itemDetail = null;
    };

    $scope.remove = function(item) {
        var confirm = $mdDialog.confirm().title("Do you want to delete this project?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            if (item.project) {
                tenderService.delete({id: item._id}).$promise.then(function() {
                    _.remove($scope.datas, {_id: item._id});
                    $scope.showToast("Successfully");
                }, function(err){$scope.showToast("Error");});
            } else {
                projectService.delete({id: item._id}).$promise.then(function(){
                    _.remove($scope.datas, {_id: item._id});
                    $scope.showToast("Successfully");
                }, function(err){$scope.showToast("Error");});
            }
        }, function() {
            
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.goToDetail = function(data) {
        if (data.project) {
            $state.go("userBackendDetail.tender", {userId: $scope.userId, tenderId: data._id});
        } else {
            $state.go("userBackendDetail.project", {userId: $scope.userId, projectId: data._id});
        }
    };

    if ($rootScope.itemDetail) {
        $scope.itemDetail = $rootScope.itemDetail;
        if ($scope.itemDetail.dateEnd) {
            $scope.itemDetail.dateEnd = new Date($scope.itemDetail.dateEnd);
        }
    }
});
