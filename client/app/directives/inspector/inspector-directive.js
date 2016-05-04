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
                    }]
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
                };
            }

            console.log($scope.data);

            $scope.createRelatedTask = function() {
                if ($scope.type==="thread") {
                    templateUrl = "app/modules/project/project-messages/detail/partials/create-related-task.html";
                } else if ($scope.type==="file") {
                    templateUrl = "app/modules/project/project-files/detail/partials/assign.html";
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

            $scope.showModalInTenderPage = function(modalName) {
                if ($scope.type==="thread") {
                    templateUrl = 'app/modules/project/project-tenders/partials/' + modalName;
                } else if (type==="file") {
                    templateUrl = 'app/modules/project/project-files/detail/partials/' + modalName;
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
        }
    };
});