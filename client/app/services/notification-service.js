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
        read : {
          method : 'PUT',
          params : {
            action : 'dashboard-read'
          }
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
        markReadByPackage : {
          method : 'PUT',
          isArray : true,
          params : {
            action : 'mark-read-by-package'
          }
        },
        create: {
          method: 'POST'
        },
        getMyFile: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'my-file'
          },
          isArray: true
        },
        getTotal : {
          method : 'GET',
          params : {
            action : 'get-total'
          }
        },
        readDocumentDashboard : {
          method : 'PUT',
          params : {
            action : 'dashboard-read-document'
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