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
        getByTeam : {
          method : 'get',
          isArray : true,
          params : {
            action : 'team'
          }
        },
        getAllProjects: {
          method: 'GET',
          isArray: true,
          params: {
            action: 'list'
          }
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true},
        updateProject: {
          method: 'put',
          params: {
            id: '@id'
          }
        }
    }
);
});