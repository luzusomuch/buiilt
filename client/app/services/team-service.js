angular.module('buiiltApp')
  .factory('teamService', function ($resource) {
    return $resource('/api/teams/:id/:action', {
      id: '@_id'},
    {
      create: {
        method: 'POST'
      },
      index: {
        method: 'GET'
      },
      update: {
        method: 'PUT',
        params: {
        }
      },
      addMember : {
        method : 'POST',
        params: {
          action : 'add-member'
        }
      },
      removeMember : {
        method : 'POST',
        params: {
          action : 'remove-member'
        }
      },
      assignLeader : {
        method : 'PUT',
        params : {
          action : 'assign-leader'
        }
      },
      leaveTeam : {
        method : 'PUT',
        params : {
          action : 'leave-team'
        }
      },
      acceptTeam : {
        method : 'PUT',
        params : {
          action : 'accept'
        }
      },
      rejectTeam : {
        method : 'PUT',
        params : {
          action : 'reject'
        }
      },
      getCurrentTeam: {
        method: 'GET',
        params: {
          id: 'me'
        }
      },
      getCurrentInvitation : {
        method: 'GET',
        isArray: true,
        params : {
          action : 'invitation'
        }
      },
      getHomeOwnerTeam: {
        method: 'GET',
        isArray: true,
        params: {
          action: 'home-owner'
        }
      }
    }
    );
  });