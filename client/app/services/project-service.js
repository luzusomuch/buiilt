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
        get: {
          method: 'GET',
          params: {
            id: 'id'
          }
        },
        selectWinner: {
          method: 'PUT',
          params: {
            id: 'id',
            action: 'winner'
          }
        },
        getProjectsByUser: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'user'
          },
          isArray: true
        }
    }
    
);
});