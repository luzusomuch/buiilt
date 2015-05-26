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
    getTheBestProviders: { method: 'GET', params: { id: 'theBestProviders'}, isArray: true },
    gets:{method:'GET', params: {action: ''}, isArray: true},
    delete: {method:'DELETE', params: {id: 'id', action: ''}},
    changePassword: { method: 'PUT', params: {id: 'id', action: 'password'}},
    changePhoneNum: { method: 'PUT', params: {id: 'id', action: 'phone'}},
  });
});