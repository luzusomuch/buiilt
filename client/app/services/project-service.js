angular.module('buiiltApp')
.factory('projectService', function($rootScope, $q, $resource) {
    return $resource('/api/projects/:id/:action',
    {
        id : '@_id'
    },
    {
        create: {
            method: 'POST'
        },
        get: {
            method: 'GET',
            params: {
                id: 'id'
            }
        },
        downloadBackUp: {
            method: "GET",
            params: {
                action: "backup"
            }
        },
        getAllProjects: {
            method: 'GET',
            isArray: true,
            params: {
                action: 'list'
            }
        },
        delete: {method:'DELETE'},
        updateProject: {
            method: 'put',
            params: {
                id: '@id'
            }
        },
        changeProjectLimit: {
            method: "POST",
            params: {
                action: "change-project-limit"
            }
        },
        getProjectLimit: {
            method: "GET", 
            params: {
                action: "get-project-limit"
            }
        }
    });
});