angular.module('buiiltApp').factory('contactBookService', function($resource) {
    return $resource('/api/contactBooks/:id/:type/:action', {id: '@_id'}, {
        create: {method: "POST", isArray: true},
        me: {
            method: "GET",
            params: {
                action: "me"
            },
            isArray: true
        }
    });
});