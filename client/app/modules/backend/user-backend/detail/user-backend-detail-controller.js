angular.module('buiiltApp').controller('UserBackendDetailCtrl', function(ngTableParams, $rootScope, $scope, tenderService, projectService, $mdDialog, $mdToast, projects, tenders, $filter) {
    var data = _.union(projects, tenders);
    $scope.datas = _.union(projects, tenders);

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


    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,           // count per page
        sorting: {
            name: 'asc'     // initial sorting
        }
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            var orderedData = params.sorting() ?
                    $filter('orderBy')(data, params.orderBy()) :
                    data;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.showModal = function(event, name, item) {
        $rootScope.itemDetail = item;
        $mdDialog.show({
            targetEvent: event,
            controller: 'UserBackendDetailCtrl',
            resolve: {
                projects: function($stateParams, projectService) {
                    return projectService.getAllProjects({userId: $stateParams.userId}).$promise;
                },
                tenders: function($stateParams, tenderService) {
                    return tenderService.getAll({userId: $stateParams.userId}).$promise;
                }
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
                    _.remove(data, {_id: item._id});
                    $scope.tableParams.reload();
                    $scope.showToast("Successfully");
                }, function(err){$scope.showToast("Error");});
            } else {
                projectService.delete({id: item._id}).$promise.then(function(projects){
                    _.remove(data, {_id: item._id});
                    $scope.tableParams.reload();
                    $scope.showToast("Successfully");
                }, function(err){$scope.showToast("Error");});
            }
        }, function() {
            
        });
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    if ($rootScope.itemDetail) {
        $scope.itemDetail = $rootScope.itemDetail;
        if ($scope.itemDetail.dateEnd) {
            $scope.itemDetail.dateEnd = new Date($scope.itemDetail.dateEnd);
        }
    }
});
