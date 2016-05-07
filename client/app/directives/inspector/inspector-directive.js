'use strict';
angular.module('buiiltApp').directive('inspector', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/inspector/inspector.html',
        scope:{
            data:'=',
            type: "@"
        },
        controller: function($scope, $rootScope, projectService, $state, dialogService, $mdDialog) {
            $scope.$state = $state;
            $scope.currentUser = $rootScope.currentUser;
            $scope.showActivity = true;
            var ctrl, resolve, templateUrl;

            if ($scope.type==="thread") {
                ctrl = "projectMessagesDetailCtrl";
                resolve = {
                    thread: ["$stateParams", "messageService", function($stateParams, messageService) {
                        return messageService.get({id: $stateParams.messageId}).$promise;
                    }],
                    people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                        return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                    }],
                    tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                        return tenderService.getAll({id: $stateParams.id}).$promise;
                    }],
                    activities:["activityService", "$stateParams", function(activityService, $stateParams) {
                        return activityService.me({id: $stateParams.id}).$promise;
                    }],
                };
            } else if ($scope.type==="file") {
                ctrl = "projectFileDetailCtrl";
                resolve = {
                    file: ["$stateParams", "fileService", function($stateParams, fileService) {
                        return fileService.get({id: $stateParams.fileId}).$promise;
                    }],
                    people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                        return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                    }],
                    tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                        return tenderService.getAll({id: $stateParams.id}).$promise;
                    }],
                    activities:["activityService", "$stateParams", function(activityService, $stateParams) {
                        return activityService.me({id: $stateParams.id}).$promise;
                    }],
                };
            } else if ($scope.type === "task") {
                ctrl = "projectTaskDetailCtrl";
            } else {
                ctrl = "projectTendersDetailCtrl";
                resolve = {
                    tender: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                        return tenderService.get({id: $stateParams.tenderId}).$promise;
                    }],
                    contactBooks: ["contactBookService", function(contactBookService) {
                        return contactBookService.me().$promise;
                    }],
                    people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                        return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                    }],
                    documentSets: ["$stateParams", "documentService", function($stateParams, documentService) {
                        return documentService.me({id: $stateParams.id}).$promise;
                    }],
                    activities: ["activityService", "$stateParams", function(activityService, $stateParams) {
                        return activityService.me({id: $stateParams.id}).$promise;
                    }],
                };
            }

            console.log($scope.data);

            $scope.createRelatedTask = function() {
                if ($scope.type==="thread") {
                    templateUrl = "app/modules/project/project-messages/detail/partials/create-related-task.html";
                } else if ($scope.type==="file") {
                    templateUrl = "app/modules/project/project-files/detail/partials/add-related-task.html";
                }
                $scope.showModal(ctrl, resolve, templateUrl);
            };

            $scope.createRelatedFile = function() {
                if ($scope.type==="thread") {
                    templateUrl = "app/modules/project/project-messages/detail/partials/create-related-file.html";
                } else if ($scope.type==="task") {

                }
                $scope.showModal(ctrl, resolve, templateUrl);
            };

            $scope.createRelatedThread = function() {
                if ($scope.type==="file") {
                    templateUrl = "app/modules/project/project-files/detail/partials/add-related-thread.html"
                }
                $scope.showModal(ctrl, resolve, templateUrl);
            };

            $scope.showModalInTenderPage = function(modalName) {
                if ($scope.type==="thread") {
                    templateUrl = 'app/modules/project/project-tenders/partials/' + modalName;
                } else if ($scope.type==="file") {
                    templateUrl = 'app/modules/project/project-files/detail/partials/' + modalName;
                } else if ($scope.type==="tender") {
                    templateUrl = 'app/modules/project/project-tenders/partials/' + modalName;
                }
                $scope.showModal(ctrl, resolve, templateUrl);
            };

            $scope.showModalAssignMember = function() {
                if ($scope.type==="thread") {
                    templateUrl = 'app/modules/project/project-messages/detail/partials/assign-team-member.html';
                } else if ($scope.type==="file") {
                    templateUrl = "app/modules/project/project-files/detail/partials/assign.html";
                }
                $scope.showModal(ctrl, resolve, templateUrl);
            };

            $scope.showModal = function(ctrl, resolve, templateUrl) {
                $mdDialog.show({
                    controller: ctrl,
                    resolve: resolve,
                    templateUrl: templateUrl,
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            };

            $scope.showTaskDetailModal = function(event, taskId) {
                $mdDialog.show({
                    controller: ["activity", "task", "people", "dialogService", "$rootScope", "$scope", "taskService", "socket",
                    function(activity, task, people, dialogService, $rootScope, $scope, taskService, socket) {
                        $scope.task = task;
                        $scope.dialogService = dialogService;
                        $scope.allowShowList = ["create-task", "edit-task", "change-date-time", "complete-task", "uncomplete-task"];
                        
                        // socket handle
                        socket.emit("join", task._id);
                        socket.on("task:update", function(data) {
                            $scope.task = data;
                            getProjectMembers();
                        });
                        // end socket handle

                        // get project member
                        function getProjectMembers(){
                            $scope.projectMembers = $rootScope.getProjectMembers(people);
                            _.each($scope.task.members, function(member) {
                                var index = _.findIndex($scope.projectMembers, function(projectMember){
                                    if (projectMember._id) {
                                        return projectMember._id.toString()===member._id.toString();
                                    }
                                });
                                if (index !== -1) {
                                    $scope.projectMembers.splice(index, 1);
                                }
                            });
                            _.each($scope.task.notMembers, function(email) {
                                var index = _.findIndex($scope.projectMembers, function(projectMember) {
                                    if (!projectMembers._id) {
                                        return projectMember.email==email;
                                    }
                                });
                                if (index !== -1) {
                                    $scope.projectMembers.splice(index, 1);
                                }
                            });
                        };
                        getProjectMembers();

                        $scope.assignMember = function(index) {
                            $scope.task.newMembers = [$scope.projectMembers[index]];
                            $scope.task.editType="assign";
                            $scope.update($scope.task);
                        };


                        $scope.addComment = function() {
                            if (!$scope.comment || $scope.comment.trim().length===0) {
                                dialogService.showToast("Please Enter Your Comment");
                            } else {
                                $scope.task.editType = "enter-comment";
                                $scope.task.comment = $scope.comment;
                                $scope.update($scope.task);
                            }
                        };

                        $scope.changeDescription = function() {
                            if ($scope.task.description.trim().length===0) {
                                dialogService.showToast("Task Description Must Be Enter");
                            } else {
                                $scope.task.editType="edit-task";
                                $scope.update($scope.task);
                            }
                        };

                        $scope.update = function(task) {
                            taskService.update({id: task._id}, task).$promise.then(function(res) {
                                console.log(res);
                                if (task.editType==="enter-comment") {
                                    $scope.comment = null;
                                    dialogService.showToast("Enter New Comment Successfully");
                                } else if (task.editType==="edit-task") {
                                    dialogService.showToast("Change Task Description Successfully");
                                } else if (task.editType==="assign") {
                                    dialogService.showToast("Assign Members To Task Successfully");
                                }
                                $scope.showEdit = false;
                            }, function(err) {
                                dialogService.showToast("Error");
                            });
                        };
                    }],
                    targetEvent: event,
                    resolve: {
                        activity: ["activityService", "$stateParams", function(activityService, $stateParams) {
                            return activityService.me({id: $stateParams.id}).$promise;
                        }],
                        task: ["taskService", "$stateParams", function(taskService, $stateParams) {
                            return taskService.get({id: taskId}).$promise;
                        }],
                        people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                            return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                        }]
                    },
                    templateUrl: 'app/modules/project/project-calendar/partials/task-detail.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                })
            };
        }
    };
});