angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state('userBackend', {
        url: '/backend/user',
        templateUrl: '/app/modules/backend/user-backend/user.html',
        controller: 'UserBackendCtrl',
        authenticate: true,
        isAdmin: true,
        resolve: {
            users: function(userService) {
                return userService.getAll().$promise;
            }
        }
    })
    .state("userBackendDetail", {
        url:"/backend/user/:userId",
        template: "<ui-view></ui-view>",
        abstract: true
    })
    .state("userBackendDetail.projectsAndTenders", {
        url: "/",
        templateUrl: "/app/modules/backend/user-backend/detail/view.html",
        controller: "UserBackendDetailCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            projects: function($stateParams, projectService) {
                return projectService.getAllProjects({userId: $stateParams.userId}).$promise;
            },
            tenders: function($stateParams, tenderService) {
                return tenderService.getAll({userId: $stateParams.userId}).$promise;
            }
        }
    })
    .state("userBackendDetail.project", {
        url: "/project/:projectId",
        templateUrl: "/app/modules/backend/user-backend/detail/project/view.html",
        controller: "UserBackendDetailProjectCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            people: function($stateParams, peopleService) {
                return peopleService.getInvitePeople({id: $stateParams.projectId, admin: true}).$promise;
            },
            tasks: function($stateParams, taskService) {
                return taskService.getProjectTask({id: $stateParams.projectId, userId: $stateParams.userId}).$promise;
            },
            messages: function($stateParams, messageService) {
                return messageService.getProjectThread({id: $stateParams.projectId, userId: $stateParams.userId}).$promise;
            },
            files: function($stateParams, fileService) {
                return fileService.getProjectFiles({id: $stateParams.projectId, type: "file", userId: $stateParams.userId}).$promise;
            },
            documents: function($stateParams, fileService) {
                return fileService.getProjectFiles({id: $stateParams.projectId, type: "document", userId: $stateParams.userId}).$promise;
            }
        }
    })
    .state("userBackendDetail.tender", {
        url: "/tender/:tenderId",
        templateUrl: "/app/modules/backend/user-backend/detail/tender/view.html",
        controller: "UserBackendDetailTenderCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            tender: function($stateParams, tenderService) {
                return tenderService.get({id: $stateParams.tenderId, admin: true}).$promise;
            }
        }
    });
});