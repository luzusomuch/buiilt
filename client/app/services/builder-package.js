angular.module('buiiltApp')
  .factory('builderPackageService', function($resource) {
    return $resource('/api/packages/builders/:id/:action', {
        id: '@_id'},
      {
        findDefaultByProject : {
            method : 'GET'
        },
        getAll: {
            method: 'get',
            params: {
                action:'list'
            },
            isArray: true
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true},
        updatePackage: {
            method: 'put',
            params: {
                id: '@id'
            }
        },
        inviteBuilder: {
            method: 'post',
            params: {
                id: '@id',
                action: 'invite-builder'
            }
        }
      }
    );
});