angular.module('buiiltApp')
.factory('packageService', function($rootScope, $q, $resource) {

  return $resource('/api/packages/:id/:action',{
    id : '@_id'},
    {
        getPackageByProject: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'project'
          },
          isArray: true
        }
    }
);
});