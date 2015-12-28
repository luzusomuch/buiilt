angular.module('buiiltApp')
  .factory('taskService', function($rootScope, $q, $resource) {
    return $resource('/api/tasks/:id/:type/:action',{
        id : '@_id',
        type : '@_type'},
      {
        getAll: {
          method: 'GET',
          params: {
            action : 'list'
          },
          isArray: true
        },
        get : {
          method : 'GET',
          // isArray : true,
          params: {
          },
          isArray: true
        },
        myTask : {
          method : 'GET',
          isArray : true,
          params : {
            type : 'dashboard',
            action : 'me'
          }
        },
        create: {
          method: 'POST'
        },
        update : {
          method : 'PUT'
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true},
        getOne: {
          method: 'get',
          params: {
            action: 'get-one'
          }
        },
        getByPackage: {
          method: 'get',
          params: {
            action: 'get-by-package'
          },
          isArray: true
        }
      }
    );
  });