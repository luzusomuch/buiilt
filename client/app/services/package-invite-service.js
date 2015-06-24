angular.module('buiiltApp')
.factory('packageInviteService', function($resource) {
  return $resource('/api/packageInvites/:id/:action', {
    id: '@_id'
  },
  {
    getByPackageInviteToken: {
      method: 'GET',
      params: {
        id: 'id',
        action: 'package-invite-token'
      }
    }
  });
});