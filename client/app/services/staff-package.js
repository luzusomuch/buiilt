angular.module('buiiltApp')
  .factory('staffPackageService', function($rootScope, $q, $resource) {
    // var currentUser = {};
    // if ($cookieStore.get('token')) {
    //   currentUser = userService.get();
    // }

    return $resource('/api/packages/staff/:id/:action',{
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
          params: {
            action : 'get'
          }
        },
        create: {
          method: 'POST'
        },
        complete : {
          method: 'PUT',
          params : {
            action : 'complete'
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