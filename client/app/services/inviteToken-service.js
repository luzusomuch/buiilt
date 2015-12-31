angular.module('buiiltApp')
  .factory('inviteTokenService', function ($resource) {
    return $resource('/api/invite-token/:id/:action', {
        id: '@_id'},
      {
        get : {
          method : 'GET'
        },
        getProjectsInvitation : {
          method : 'GET',
          params: {
            action: 'projects-invitation'
          },
          isArray: true
        }
      }
    );
  });