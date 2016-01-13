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
    interested: {
      method: 'PUT',
      params: {
        id: 'id',
        action: 'interested'
      }
    },
    disinterested: {
      method: 'PUT',
      params: {
        id: 'id',
        action: 'disinterested'
      }
    },
    getFileByStateParam: {
      method: 'GET',
      params: {
        id: 'id',
        action: 'params'
      },
      isArray: true
    },
    downloadFile: {
      method: 'GET',
      params: {
        id: 'id',
        action: 'download'
      }
    },
    downloadAll: {
      method: 'GET',
      params: {
        id: 'id',
        action: 'download-all'
      },
      isArray: true
    },
    getAll: {
      method: 'get',
      params: {
        action: 'get-all'
      },
      isArray: true
    },
    getFileByPackage: {
      method: 'get',
      params: {
        action: 'get-by-package'
      },
      isArray: true
    },
    sendToDocumentation: {
      method: 'post',
      params: {
        id: '@id',
        action: 'send-to-document'
      }
    },
    getFileInPeople: {
      method: 'get',
      params: {
        action: 'get-in-people'
      },
      isArray: true
    },
    getFileInBoard: {
      method: 'get',
      params: {
        action: 'get-in-board'
      },
      isArray: true
    },
    getFileInProject: {
      method: 'get',
      params: {
        action: 'get-in-project'
      },
      isArray: true
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