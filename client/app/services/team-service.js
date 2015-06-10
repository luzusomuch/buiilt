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
          id: '@id'
        }
      },
      addMember : {
        method : 'POST',
        isArray : true,
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
      getCurrentTeam: {
        method: 'GET',
        params: {
          id: 'me'
        }
      }
    }
    );
  });