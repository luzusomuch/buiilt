'use strict';
angular.module('buiiltApp').directive('tenderItems', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/tenderItems/tenderItems.html',
        scope:{
            data:'='
        },
        controller: function($scope, $rootScope, $location, userService, projectService, $state, $mdDialog) {
            $scope.errors = {};
            $scope.success = {};
			$scope.$state = $state;
            $scope.currentUser = $rootScope.currentUser;
            console.log($scope.data);
            $scope.data.members = _.uniq($scope.data.members, "_id");

			$scope.showAddendumDetailModal = function ($event, addendum) {
				$mdDialog.show({
				    targetEvent: $event,
			        controller: function($scope, $stateParams, $state){
                        $scope.addendum = addendum;

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };

                        $scope.download = function() {
                            filepicker.exportFile(
                                {url: addendum.element.link, filename: addendum.element.name},
                                function(Blob){
                                    console.log(Blob.url);
                                }
                            );
                        };
                    },
			        templateUrl: 'app/modules/project/project-tenders/detail/addendum-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTeamMemberModal = function ($event, userId) {
				$mdDialog.show({
				    targetEvent: $event,
                    controller: function($mdDialog, $scope, userService) {
                        userService.getUserProfile({id: userId}).$promise.then(function(user) {
                            $scope.userInfo = user;
                        });
                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    },
		            templateUrl: 'app/modules/project/project-team/detail/project-teamMember-riWindow.html',
		            parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedFilesModal = function ($event, file) {
                $mdDialog.show({
                    targetEvent: $event,
                    controller: function($scope, $state, $stateParams) {
                        $scope.file = file;
                        console.log($scope.file);
                        $scope.goToThisFile = function() {
                            $scope.closeModal();
                            $state.go("project.files.detail", {id: $stateParams.id, fileId: file.item._id});
                        };

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    },
			        templateUrl: 'app/modules/project/project-files/detail/project-files-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
			
			$scope.showRelatedTasksModal = function ($event, task) {
				$mdDialog.show({
				    targetEvent: $event,
			        controller: function($scope, $state, $stateParams){
                        $scope.task = task;
                        $scope.task.project = $stateParams.id;

                        $scope.goToThisThread = function(project, task) {
                            $scope.closeModal();
                            $state.go("project.tasks.detail", {id: project, taskId: task});
                        };

                        $scope.closeModal = function() {
                            $mdDialog.cancel();
                        };
                    },
			        templateUrl: 'app/modules/project/project-tasks/detail/project-tasks-riWindow.html',
			        parent: angular.element(document.body),
			        clickOutsideToClose: false
			    });
			};
        }
    };
});