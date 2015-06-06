angular.module('buiiltApp')
  .factory('teamService', function ($resource) {
    return $resource('/api/teams/:id/:action', {
      id: '@_id'},
    {
      create: {
        method: 'POST'
      },
      index: {
        method: 'GET',
        isArray: true
      },
      update: {
        method: 'PUT'
      },
      getTeamByUser: {
        method: 'GET',
        params: {
          id: 'id',
          action: 'user'
        }
      }
    }
    );
  });