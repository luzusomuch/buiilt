angular.module('buiiltApp')
.factory('uploadService', function($rootScope, $q, $resource) {

  return $resource('/api/uploads/:id/:action',{
    id : '@_id'},
    {
        upload: {
            method: 'POST',
            params: {
                id: '@id',
                action: 'file'
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
            }
        },
        uploadInBoard: {
            method: 'POST', 
            params: {
                id: '@id',
                action: 'file-in-board'
            }
        }
    }
);
});