angular.module('buiiltApp')
.factory('projectService', function($rootScope, $q, $resource) {

  return $resource('/api/projects/:id/:action',{
    id : '@_id'},
    {
        create: {
            method: 'POST'
        },
        update: {
          method: 'PUT'
        }
    }
    
);
});