angular.module('buiiltApp')
  .factory('notificationService', function($rootScope, $q, $resource) {
    // var currentUser = {};
    // if ($cookieStore.get('token')) {
    //   currentUser = userService.get();
    // }

    return $resource('/api/notifications/:id/:action',{
        id : '@_id'},
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
          isArray : true
        },
        markAsRead : {
          method : 'PUT',
          params : {
            action : 'mark-as-read'
          }
        },
        markAllAsRead : {
          method : 'PUT',
          isArray : true,
          params : {
            action : 'mark-all-as-read'
          }
        },
        create: {
          method: 'POST'
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