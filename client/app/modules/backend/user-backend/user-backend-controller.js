angular.module('buiiltApp').controller('UserBackendCtrl', function($rootScope, $scope, users, userService, $mdDialog, $mdToast) {
    $scope.users = users;

    $scope.search = function(user) {
        var found = false;
        var text = $scope.searchText;
        if (text && text.length > 0) {
            if ((user.phoneNumber && user.phoneNumber.indexOf(text) > -1) || user.email.indexOf(text) > -1 || user.name.toLowerCase().indexOf(text) > -1 || user.name.indexOf(text) > -1) {
                found = true
            }
            return found;
        } else {
            return true;
        }
    };

    $scope.remove = function(user){
        var confirm = $mdDialog.confirm().title("Do you want to delete this user?").ok("Yes").cancel("No");
        $mdDialog.show(confirm).then(function() {
            userService.delete({id: user._id}).$promise.then(function(){
                _.remove($scope.users, {_id: user._id});
                $scope.showToast("Successfully");
            }, function(err){$scope.showToast("Error")});
        }, function() {
            
        });
    };

    $scope.editUser = function() {
        userService.adminUpdate({id: $scope.user._id},$scope.user).$promise.then(function(project) {
            $scope.closeModal();
            $scope.showToast("Successfully");
            $rootScope.backendEditUser = null;
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