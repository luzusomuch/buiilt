angular.module('buiiltApp')
.factory('tenderService', function($resource) {

    return $resource('/api/tenders/:id/:action',
    {
        id : '@_id'
    },
    {
        getAll: {
            method: 'GET',
            params: {
                action: "get-all"
            },
            isArray: true
        },
        get: {
            method: "GET"
        },
        create: {
            method: "POST"
        },
        update: {
            method: "PUT"
        }
    });
});