angular.module('buiiltApp').controller('UserBackendDetailCtrl', function(ngTableParams, $rootScope, $scope, userService, $mdDialog, $mdToast, projects, tenders, $filter) {
    var data = _.union(projects, tenders);
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

    if ($rootScope.itemDetail) {
        $scope.itemDetail = $rootScope.itemDetail;
        if ($scope.itemDetail.dateEnd) {
            $scope.itemDetail.dateEnd = new Date($scope.itemDetail.dateEnd);
        }
    }
});
