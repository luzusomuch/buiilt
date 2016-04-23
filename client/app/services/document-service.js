angular.module('buiiltApp').factory('documentService', function($resource) {
    return $resource('/api/documents/:id/:type/:action', {id: '@_id'}, {
        create: {method: "POST"},
        update: {method: "PUT"},
        me: {
            method: "GET",
            params: {
                action: "me"
            },
            isArray: true
        }
    });
});