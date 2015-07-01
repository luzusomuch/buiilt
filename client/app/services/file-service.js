angular.module('buiiltApp').factory('fileService', function($rootScope, $q, $resource) {
    return $resource('/api/files/:id/:action', {
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
            }
    });
});