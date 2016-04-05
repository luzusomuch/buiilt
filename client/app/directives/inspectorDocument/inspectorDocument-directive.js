'use strict';
angular.module('buiiltApp').directive('inspectorDocument', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/inspectorDocument/inspectorDocument.html',
        scope:{
            data:'=',
            hideRelatedThread: "@"
        },
        controller: function($scope, $rootScope, $location, userService, projectService, $state, $mdDialog) {
			$scope.$state = $state;
            $scope.currentUser = $rootScope.currentUser;
            $scope.data.members.push($scope.data.owner);
            $scope.data.members.push($scope.currentUser);
            $scope.data.members = _.uniq($scope.data.members, "_id");
			$scope.showMembers = false;
			$scope.showRelatedTasks = false;
			$scope.showSharedFiles = false;
			$scope.showDetail = false;
			$scope.showActivity = false;

			$scope.showRelatedMessageModal = function ($event, relatedItem) {
				$mdDialog.show({
				    targetEvent: $event,
			        controller: ["$scope", "$stateParams", "$state",
                    function($scope, $stateParams, $state){
                        $scope.relatedItem = relatedItem;
                        $scope.relatedItem.project = $stateParams.id;

                        $scope.goToThisThread = function(project, thread) {
                            $scope.closeModal();
                            $state.go("project.messages.detail", {id: project, messageId: thread});
                        };

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    }],
			        templateUrl: 'app/modules/project/project-messages/detail/partials/project-messages-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTeamMemberModal = function ($event, userId) {
				$mdDialog.show({
				    targetEvent: $event,
                    controller: ["$mdDialog", "$scope", "userService", 
                    function($mdDialog, $scope, userService) {
                        userService.getUserProfile({id: userId}).$promise.then(function(user) {
                            $scope.userInfo = user;
                        });
                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    }],
		            templateUrl: 'app/modules/project/project-team/detail/project-teamMember-riWindow.html',
		            parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedFilesModal = function ($event, file) {
                $mdDialog.show({
                    targetEvent: $event,
                    controller: ["$scope", "$state", "$stateParams",
                    function($scope, $state, $stateParams) {
                        $scope.file = file;
                        console.log($scope.file);
                        $scope.goToThisFile = function() {
                            $scope.closeModal();
                            $state.go("project.files.detail", {id: $stateParams.id, fileId: file.item._id});
                        };

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    }],
			        templateUrl: 'app/modules/project/project-files/detail/project-files-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTasksModal = function ($event, task) {
				$mdDialog.show({
				    targetEvent: $event,
			        controller: ["$scope", "$state", "$stateParams", 
                    function($scope, $state, $stateParams){
                        $scope.task = task;
                        $scope.task.project = $stateParams.id;

                        $scope.goToThisThread = function(project, task) {
                            $scope.closeModal();
                            $state.go("project.tasks.detail", {id: project, taskId: task});
                        };

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    }],
			        templateUrl: 'app/modules/project/project-tasks/detail/project-tasks-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
        }
    };
});