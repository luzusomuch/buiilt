angular.module('buiiltApp')
.factory('validateInviteService', function($resource) {
  return $resource('/api/validateInvites/:id/:action', {
    id: '@_id'
  },
  {
    getByUser: {
      method: 'GET'
    }
  });
});