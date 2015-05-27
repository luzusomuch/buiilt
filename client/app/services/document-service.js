angular.module('buiiltApp').factory('documentService', function($rootScope, $q, $resource) {
    return $resource('/api/document/:id/:action', {
        id: '@_id'},{
            index: {
              method: 'GET',
              isArray: true
            }
    });
});