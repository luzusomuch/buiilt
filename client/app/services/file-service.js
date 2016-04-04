angular.module('buiiltApp').factory('fileService', function($resource) {
return $resource('/api/files/:id/:type/:action', {
    id: '@_id'},{
    get: {
        method: 'GET',
    },
    getProjectFiles: {
        method: "GET",
        params: {
            action: "project-files"
        },
        isArray: true
    },
    update: {
        method: "PUT"
    },
    acknowledgement: {
        method: "GET",
        params: {
            action: "acknowledgement"
        }
    },
    assignMoreMembers: {
        method: "PUT", 
        params: {
            action: "assign-more-members"
        }
    },
    lastAccess: {
        method: "GET",
        params: {
            action: "last-access"
        }
    },
    myFiles: {
        method: 'GET',
        params: {
            action: 'my-files'
        },
        isArray: true
    }
  });
});