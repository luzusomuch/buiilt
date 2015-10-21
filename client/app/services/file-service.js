angular.module('buiiltApp').factory('fileService', function($rootScope, $q, $resource) {
  return $resource('/api/files/:id/:type/:action', {
id: '@_id'},{
    getByDocument: {
      method: 'GET',
      params: {
        id: 'id',
        action: 'document'
      },
      isArray: true
    },
    get: {
        method: 'GET',
        params: {
            id: 'id'
        }
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
  });
});