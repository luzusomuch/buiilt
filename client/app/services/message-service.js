angular.module('buiiltApp')
  .factory('messageService', function($rootScope, $q, $resource) {
    // var currentUser = {};
    // if ($cookieStore.get('token')) {
    //   currentUser = userService.get();
    // }

    return $resource('/api/messages/:id/:type/:action',{
        id : '@_id',
        type : '@_type'},
      {
        myThread : {
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
        create: {
          method: 'POST'
        },
        update : {
          method : 'PUT'
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
        }
        //update: {
        //  method: 'PUT'
        //},
        //get: {
        //  method: 'GET'
        //  // isArray: true
        //},
        //getByProjectId: {
        //  method: 'GET',
        //  params: {
        //    id: 'id',
        //    action: 'project'
        //  },
        //  isArray: true
        //}
      }
      // createProject: function(project, callback) {
      //   var cb = callback || angular.noop;

      //   return $this.save(project,
      //   function(data) {
      //     return cb(project);
      //   },
      //   function(err) {
      //     return cb(err);
      //   }.bind(this)).$promise;
      // }
    );
  });