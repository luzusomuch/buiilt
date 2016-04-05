angular.module('buiiltApp').factory('taskService', function($resource) {
    return $resource('/api/tasks/:id/:type/:action',{
        id : '@_id',
        type : '@_type'
    },
    {
        get : {
            method : 'GET',
        },
        create: {
            method: 'POST'
        },
        update : {
            method : 'PUT'
        },
        getProjectTask: {
            method: "GET",
            params: {action: "project-tasks"},
            isArray: true
        },
        myTask : {
            method : 'GET',
            isArray : true,
            params : {
                type : 'dashboard',
                action : 'me'
            }
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true}
    });
});