angular.module('buiiltApp')
  .factory('teamInviteService', function ($resource) {
    return $resource('/api/team-invite/:id/:action', {
        id: '@_id'},
      {
        get : {
          method : 'GET'
        }
      }
    );
  });