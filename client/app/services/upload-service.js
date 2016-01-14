angular.module('buiiltApp')
.factory('uploadService', function($resource) {

  return $resource('/api/uploads/:id/:action',
    {
        id : '@_id'
    },
    {
        upload: {
            method: 'POST',
            params: {
                id: '@id',
            },
            isArray: true
        },
        uploadReversion: {
            method: "POST",
            params: {
                id: '@id',
                action: 'upload-reversion'
            }
        },
        uploadInPackage: {
            method: 'POST', 
            params: {
                id: '@id',
                action: 'file-package'
            }
        },
        uploadInPeople: {
            method: 'POST', 
            params: {
                id: '@id',
                action: 'file-in-people'
            },
            isArray: true
        },
        uploadInBoard: {
            method: 'POST', 
            params: {
                id: '@id',
                action: 'file-in-board'
            },
            isArray: true
        }
    }
);
});