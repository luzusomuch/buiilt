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
      }
    );
});