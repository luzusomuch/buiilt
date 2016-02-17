angular.module('buiiltApp').controller('UserBackendCtrl', function(ngTableParams, $rootScope, $scope, users, userService, $mdDialog, $mdToast) {
    var data = users;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10           // count per page
    }, {
        total: data.length, // length of data
        getData: function ($defer, params) {
            $defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        }
    });

    $scope.remove = function(user){
        userService.delete({'id': user._id}).$promise.then(function(users){
            _.remove(data, {_id: user._id});
            $scope.tableParams.reload();
        });
    };

    $scope.editUser = function() {
        userService.adminUpdate({id: $scope.user._id},$scope.user).$promise.then(function(project) {
            $scope.closeModal();
            $scope.showToast("Successfully");
            $rootScope.backendEditUser = null;
            _.remove(data, {_id: $scope.user._id});
            data.push(user);
            $scope.tableParams.reload();
        }, function(err) {$scope.showToast("Error");});
    };

    $scope.showModal = function($event, user){
        $rootScope.backendEditUser = user;
        $mdDialog.show({
            targetEvent: $event,
            controller: 'UserBackendCtrl',
            resolve: {
                users: function(userService) {
                    return userService.getAll().$promise;
                }
            },
            templateUrl: 'app/modules/backend/partials/edit-user-modal.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    if ($rootScope.backendEditUser) {
        $scope.user = $rootScope.backendEditUser;
    }
});