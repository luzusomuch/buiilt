angular.module('buiiltApp').config(function($stateProvider) {
    $stateProvider
    .state("teamBackend", {
        url:"/backend/team",
        template: "<ui-view></ui-view>",
        abstract: true
    })
    .state("teamBackend.all", {
        url: "/all",
        templateUrl: "/app/modules/backend/team-backend/all/view.html",
        controller: "TeamBackendListCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            teams: function(teamService) {
                return teamService.getAll().$promise;
            }
        }
    })
    .state("teamBackend.detail", {
        url: "/:teamId",
        templateUrl: "/app/modules/backend/team-backend/detail/view.html",
        controller: "TeamBackendDetailCtrl",
        authenticate: true,
        isAdmin: true,
        resolve: {
            team: function($stateParams, teamService) {
                return teamService.index({teamId: $stateParams.teamId}).$promise;
            },
            projectLimit: function($stateParams, projectService) {
                return projectService.getProjectLimit({teamId: $stateParams.teamId}).$promise;
            }
        }
    })
});