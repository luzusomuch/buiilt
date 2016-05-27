angular.module('buiiltApp').factory('uploadService', function($resource) {
    return $resource('/api/uploads/:id/:action',
    {
        id : '@_id'
    },
    {
        upload: {
            method: 'POST',
            params: {
                id: '@id',
            }
        },
        uploadReversion: {
            method: "POST",
            params: {
                id: '@id',
                action: 'upload-reversion'
            }
        },
        uploadBulkDocument: {
            method: "POST",
            params: {
                id: "@id",
                action: "upload-bulk-document"
            },
            isArray: true
        }
    });
});