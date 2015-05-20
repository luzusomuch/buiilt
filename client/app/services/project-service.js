angular.module('buiiltApp')
.factory('projectService', function($rootScope, $q, $resource) {
  // var currentUser = {};
  // if ($cookieStore.get('token')) {
  //   currentUser = userService.get();
  // }

  return $resource('/api/projects/:id/:action',{
    id : '@_id'},
    {
        create: {
            method: 'POST'
        }
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