angular.module('buiiltApp')
.factory('projectService', function($rootScope, $q, $resource) {

  return $resource('/api/projects/:id/:action',{
    id : '@_id'},
    {
        create: {
            method: 'POST'
        },
        index: {
            method: 'GET',
            isArray: true
        },
        selectWinner: {
          method: 'PUT',
          params: {
            id: 'id',
            action: 'winner'
          }
        }
    }
    
);
});