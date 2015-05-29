angular.module('buiiltApp').factory('documentService', function($rootScope, $q, $resource) {
    return $resource('/api/documents/:id/:action', {
        id: '@_id'},{
            getByProjectAndPackage: {
              method: 'GET',
              params: {
                id: 'id',
                action: 'package'
              },
              isArray: true
            }
    });
});