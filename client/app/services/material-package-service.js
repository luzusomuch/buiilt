angular.module('buiiltApp')
.factory('materialPackageService', function($resource) {
  return $resource('/api/materials/:id/:action', {
    id: '@_id'},{
        createMaterialPackage: {
            method: 'POST'
        }
    });
});
