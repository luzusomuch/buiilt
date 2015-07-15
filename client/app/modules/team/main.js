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
        authenticate : true,
        resolve: {
          invitations : [
            'authService',
            function(authService) {
              return authService.getCurrentInvitation().$promise;
            }
          ],
          users : [
            'userService',
            function(userService) {
              return userService.getAll().$promise;
            }
          ],
          currentTeam : [
            'authService',
            function(authService) {
              return authService.getCurrentTeam().$promise;
            }
          ],
          currentUser : [
            'authService',
            function(authService) {
              return authService.getCurrentUser().$promise;
            }
          ]
        },
      })
      .state('team.create', {
        url: '/create',
        templateUrl: '/app/modules/team/create-team/create.html',
        controller: 'CreateTeamCtrl',
        authenticate : true
      });
  });