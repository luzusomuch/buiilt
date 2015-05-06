angular.module('buiiltApp')
.factory('userService', function($resource) {
  return $resource('/api/users/:id/:action', {
    id: '@uuid'
  },
  {
    get: {
      method: 'GET',
      params: {
        id: 'me'
      }
    },
    getTheBestProviders: { method: 'GET', params: { id: 'theBestProviders'}, isArray: true }
  });
});