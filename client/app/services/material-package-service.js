angular.module('buiiltApp')
.factory('materialPackageService', function($resource) {
  return $resource('/api/materials/:id/:action', {
    id: '@_id'},{
        createMaterialPackage: {
            method: 'POST'
        },
        getMaterialPackageTenderByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tender-builder'
            },
            isArray: true
        },
        getMaterialPackageInProcessByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processing-builder'
            },
            isArray: true
        },
        getMaterialPackageInTenderByProjectForSupplier: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tender-supplier'
            },
            isArray: true
        },
        getMaterialPackageInProcessByProjectForSupplier: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processing-supplier'
            },
            isArray: true
        }
    });
});
