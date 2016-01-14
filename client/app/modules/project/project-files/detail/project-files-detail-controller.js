angular.module('buiiltApp').controller('projectFileDetailCtrl', function($scope, $rootScope, file, $mdDialog, uploadService, fileService, $mdToast, peopleService, $stateParams) {
	$scope.file = file;
    $scope.isShowRelatedItem = true;

    $scope.showRelatedItem = function() {
        $scope.isShowRelatedItem = !$scope.isShowRelatedItem;
    };

    $scope.$watch("isShowRelatedItem", function(value) {

    });

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
            _.each(file.members, function(member) {
                _.remove($scope.membersList, {_id: member._id});
            });

            // remove current user from the members list
            _.remove($scope.membersList, {_id: $rootScope.currentUser._id});
        });
    };

    $scope.showModal = function($event, modalName) {
        if (modalName === "add-related-thread.html") {
            $scope.relatedThread = {};
        } else if (modalName === "add-related-task.html") {
            $scope.relatedTask = {};
        } else if (modalName === "add-related-file.html") {
            $scope.relatedFile = {};
        }
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectFileDetailCtrl',
            resolve: {
                file: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.fileId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.editFile = function(form) {
        if (form.$valid) {
            $scope.file.editType = "edit";
            $scope.update($scope.file);
        } else {
            $scope.showToast("Error");
        }
    };

    $scope.selectMember = function(index) {
        $scope.membersList[index].select = !$scope.membersList[index].select;
    };

    $scope.assignMember = function() {
        $scope.file.newMembers = _.filter($scope.membersList, {select: true});
        $scope.file.editType = "assign";
        $scope.update($scope.file);
    };

    $scope.update = function(file) {
        if (file.tags.length === 0) {
            $scope.showToast("Please enter at least 1 tag");
            return;
        } else if (file.members.length === 0) {
            $scope.showToast("Please select at least 1 invitee");
            return;
        }
        fileService.update({id: file._id}, file).$promise.then(function(res) {
            $scope.file = file;
            $scope.closeModal();
            switch (file.editType) {
                case "edit":
                    $scope.showToast("Update file information successfully");
                break;

                case "assign":
                    $scope.showToast("Assign more invitees successfully");
                break;

                default:
                break
            }
        }, function(err) {$scope.showToast("Error");});
    };


    getProjectMembers($stateParams.id);
});