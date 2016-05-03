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
            $scope.showMembers = false;
            $scope.showRelatedTasks = false;
            $scope.showRelatedMessages = false;
            $scope.showDetail = false;
            $scope.showActivity = true;

            console.log($scope.data);

            $scope.showModalInTenderPage = function(modalName) {
                $mdDialog.show({
                    controller: 'projectTendersDetailCtrl',
                    resolve: {
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
                    },
                    templateUrl: 'app/modules/project/project-tenders/partials/' + modalName,
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            };

            $scope.showModalAssignMember = function() {
                if ($scope.type==="thread") {
                    $mdDialog.show({
                        // targetEvent: $event,
                        controller: 'projectMessagesDetailCtrl',
                        resolve: {
                            thread: ["$stateParams", "messageService", function($stateParams, messageService) {
                                return messageService.get({id: $stateParams.messageId}).$promise;
                            }],
                            people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                                return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                            }],
                            tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                                return tenderService.getAll({id: $stateParams.id}).$promise;
                            }]
                        },
                        templateUrl: 'app/modules/project/project-messages/detail/partials/assign-team-member.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: false
                    });
                } else if ($scope.type==="file") {
                    $mdDialog.show({
                        // targetEvent: $event,
                        controller: 'projectFileDetailCtrl',
                        resolve: {
                            file: ["$stateParams", "fileService", function($stateParams, fileService) {
                                return fileService.get({id: $stateParams.fileId}).$promise;
                            }],
                            people: ["peopleService", "$stateParams", function(peopleService, $stateParams) {
                                return peopleService.getInvitePeople({id: $stateParams.id}).$promise;
                            }],
                            tenders: ["tenderService", "$stateParams", function(tenderService, $stateParams) {
                                return tenderService.getAll({id: $stateParams.id}).$promise;
                            }]
                        },
                        templateUrl: 'app/modules/project/project-files/detail/partials/assign.html',
                        parent: angular.element(document.body),
                        clickOutsideToClose: false
                    });
                }
            };
        }
    };
});