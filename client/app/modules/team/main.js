angular.module('buiiltApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('team', {
        url: '/team',
        template: '<div ui-view></div>'
      })
      .state('team.manager', {
        url: '/manager',
        templateUrl: '/app/modules/team/manager-team/manager.html',
        controller: 'TeamCtrl',
        resolve: {
          invitations : [
            'teamService',
            function(authService) {
              return authService.getCurrentInvitation();
            }
          ]
        },
        hasCurrenrProject : false
      })
      .state('team.create', {
        url: '/create',
        templateUrl: '/app/modules/team/create-team/create.html',
        controller: 'CreateTeamCtrl'
      });
  });