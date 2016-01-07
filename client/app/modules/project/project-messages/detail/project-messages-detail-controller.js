angular.module('buiiltApp').controller('projectMessagesDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, messageService, $mdToast, $mdDialog, $state, thread) {
    $scope.thread = thread;
    $scope.thread.members.push(thread.owner);
    _.remove($scope.thread.members, {_id: $rootScope.currentUser._id});
    $rootScope.title = thread.name;

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showModal = function(name, $event) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectMessagesDetailCtrl',
            resolve: {
                thread: function($stateParams, messageService) {
                    return messageService.get({id: $stateParams.messageId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-messages/detail/partials/' + name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.showReplyModal = function($event) {
        $scope.message = {};
        $scope.showModal("reply-message-modal.html", $event);
    };

    $scope.sendMessage = function() {
        if ($scope.message.text && $scope.message.text != ' ' && $scope.message.text.length > 0) {
            messageService.sendMessage({id: $scope.thread._id}, $scope.message).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Send message successfully!");
            }, function(err) {$scope.showToast("Error");});
        } else {
            $scope.showToast("Please check your message again!");
        }
    };

    $scope.showEditMessageModal = function($event) {
        $scope.showModal("edit-message-modal.html", $event);
    };

    $scope.editMessage = function(form) {
        if (form.$valid) {
            messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Update message successfully!");
                $scope.thread.name = res.name;
            }, function(err){$scope.showToast("Error");});
        }
    };
});