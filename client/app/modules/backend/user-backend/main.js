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
    });
});