angular.module('buiiltApp')
  .factory('messageService', function($rootScope, $q, $resource) {
    return $resource('/api/messages/:id/:type/:action',{
        id : '@_id',
        type : '@_type'},
      {
        create: {
          method: 'POST'
        },
        update : {
          method : 'PUT'
        },
        getProjectThread: {
          method: "GET",
          params:{
            action: "project-thread"
          },
          isArray: true
        },
        myMessages : {
          method : 'GET',
          isArray : true,
          params : {
            type : 'dashboard',
            action : 'me'
          }
        },
        getOne : {
          method : 'GET',
          params : {
            action : 'one'
          }
        },
        get : {
          method : 'GET',
          isArray : true,
          params: {
          }
        },
        sendMessage : {
          method : 'POST',
          //isArray : true,
          params : {
            action : 'message'
          }
        },
        getAll: {
          method: 'get',
          params: {
            action: 'list'
          },
          isArray: true
        },
        delete: {method:'DELETE', params: {id: 'id', action: ''}, isArray: true},
        getByPackage: {
          method: 'get',
          params: {
            action: 'get-by-package'
          },
          isArray: true
        },
        getThread:{
          method: 'get',
          params: {
            action: 'get-thread'
          }
        }
      }
    );
  });