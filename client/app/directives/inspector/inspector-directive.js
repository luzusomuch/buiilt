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
            // $scope.data.members.push($scope.data.owner);
            // $scope.data.members.push($scope.currentUser);
            // $scope.data.members = _.uniq($scope.data.members, "_id");
            $scope.showMembers = false;
            $scope.showRelatedTasks = false;
            $scope.showRelatedMessages = false;
            $scope.showDetail = false;
            $scope.showActivity = true;

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
                        }]
                    },
                    templateUrl: 'app/modules/project/project-tenders/partials/' + modalName,
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            };
        }
    };
});