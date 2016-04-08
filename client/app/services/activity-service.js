angular.module('buiiltApp').factory('activityService', function($resource) {
    return $resource('/api/activities/:id/:type/:action', {id: '@_id'}, {
        get: {method: 'GET'},
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