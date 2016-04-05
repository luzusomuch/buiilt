angular.module('buiiltApp').factory('messageService', function($resource) {
    return $resource('/api/messages/:id/:type/:action',{
        id : '@_id',
        type : '@_type'
    },
    {
        create: {
            method: 'POST'
        },
        update : {
            method : 'PUT'
        },
        getProjectThread: {
            method: "GET",
            params:{
                action: "project-thread"
            },
            isArray: true
        },
        get : {
            method : 'GET',
        },
        sendMessage : {
            method : 'POST',
            params : {
                action : 'message'
            }
        },
        lastAccess: {
            method: "GET",
            params: {
                action: "last-access"
            }
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true},
    });
});