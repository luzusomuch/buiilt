angular.module('buiiltApp')
  .factory('builderPackageService', function($resource) {
    return $resource('/api/packages/builders/:id/:action', {
        id: '@_id'},
      {
        findDefaultByProject : {
          method : 'GET'
        }
      }
    );
});