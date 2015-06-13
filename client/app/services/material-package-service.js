angular.module('buiiltApp')
.factory('materialPackageService', function($resource) {
  return $resource('/api/materials/:id/:action', {
    id: '@_id'},{
        createMaterialPackage: {
            method: 'POST'
        },
        getMaterialPackageTenderByProject: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tender'
            },
            isArray: true
        },
        getMaterialPackageInProcessByProject: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processing'
            },
            isArray: true
        }
    });
});
