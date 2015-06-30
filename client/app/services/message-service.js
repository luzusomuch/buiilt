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
            id : 'me'
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