angular.module('buiiltApp')
.factory('quoteService', function($rootScope, $q, $resource) {
  // var currentUser = {};
  // if ($cookieStore.get('token')) {
  //   currentUser = userService.get();
  // }

  return $resource('/api/quotes/:id/:action',{
    id : '@_id'},
    {
        index: {
          method: 'GET',
          isArray: true
        },
        create: {
            method: 'POST'
        },
        update: {
          method: 'PUT'
        },
        get: {
          method: 'GET',
          params: {
            id: 'id'
          }
          // isArray: true
        },
        getForMaterial: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'material'
          }
          // isArray: true
        },
        getByProjectId: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'project'
          },
          isArray: true
        },
        createUserForHomeBuilderRequest: {
          method: 'POST'
        },
        selectWinnerByQuoteDocument: {
          method: 'PUT',
          params: {
            id: '@id',
            action: 'select-winner-by-quote-document'
          }
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