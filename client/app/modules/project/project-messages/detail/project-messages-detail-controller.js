angular.module('buiiltApp').controller('projectMessagesDetailCtrl', function($rootScope, $scope, $timeout, $stateParams, messageService, $mdToast, $mdDialog, $state, thread, peopleService) {
    $scope.error = {};
    $scope.thread = thread;
    $scope.thread.members.push(thread.owner);
    _.remove($scope.thread.members, {_id: $rootScope.currentUser._id});
    $rootScope.title = thread.name;
    $rootScope.currentUser.isLeader = (_.findIndex($rootScope.currentTeam.leader, function(leader){return leader._id == $rootScope.currentUser._id}) !== -1) ? true: false;

    function getProjectMembers(id) {
        $scope.membersList = [];
        peopleService.getInvitePeople({id: id}).$promise.then(function(people) { 
            if ($rootScope.currentUser.isLeader) {
                _.each($rootScope.roles, function(role) {
                    _.each(people[role], function(tender) {
                        if (tender.hasSelect) {
                            var winnerTenderer = tender.tenderers[0];
                            if (winnerTenderer._id) {
                                winnerTenderer._id.select = false;
                                $scope.membersList.push(winnerTenderer._id);
                            } else if (winnerTenderer.email) {
                                $scope.membersList.push({email: winnerTenderer.email, type: role, select: false});
                            }
                        }
                        // get employees list
                        var currentTendererIndex = _.findIndex(tender.tenderers, function(tenderer) {
                            if (tenderer._id) {
                                return tenderer._id._id == $rootScope.currentUser._id;
                            }
                        });
                        if (currentTendererIndex !== -1) {
                            var currentTenderer = tender.tenderers[currentTendererIndex];
                            _.each(currentTenderer.teamMember, function(member) {
                                member.select = false;
                                $scope.membersList.push(member);
                            });
                        }
                    });
                });
            } else {
                $scope.membersList = $rootScope.currentTeam.leader;
                _.each($rootScope.currentTeam.member, function(member) {
                    $scope.membersList.push(member);
                });
            }
            // get unique member 
            $scope.membersList = _.uniq($scope.membersList, "_id");

            // filter members list again
            _.each(thread.members, function(member) {
                _.remove($scope.membersList, {_id: member._id});
            });

            // remove current user from the members list
            _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
            console.log($scope.membersList);
        });
    };

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
            $scope.thread.updateInfo = true;
            messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Update message successfully!");
                $scope.thread.name = res.name;
            }, function(err){$scope.showToast("Error");});
        }
    };

    $scope.copySuccess = function() {
        $scope.showToast("Copy message thread successfully!");
    };

    $scope.copyError = function() {
        $scope.showToast("Copy message error");
    };

    $scope.showAssignTeamMemberModal = function($event) {
        $scope.showModal("assign-team-member.html", $event)
    };

    $scope.selectMember = function(index) {
        $scope.membersList[index].select = !$scope.membersList[index].select;
    };

    $scope.assignMember = function() {
        $scope.thread.newMembers = _.filter($scope.membersList, {select: true});
        $scope.thread.elementType = "assign";
        if ($scope.thread.newMembers) {};
        messageService.update({id: $scope.thread._id}, $scope.thread).$promise.then(function(res) {
            $scope.closeModal();
            $scope.showToast("Assign user to " +res.name+ " successfully!");
            getProjectMembers($stateParams.id);
            $scope.thread = res;
        }, function(err){$scope.showToast("Something went wrong");});
    };

    getProjectMembers($stateParams.id);
});