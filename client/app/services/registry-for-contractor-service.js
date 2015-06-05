angular.module('buiiltApp')
.factory('registryForContractorService', function($rootScope, $q, $resource) {
  // var currentUser = {};
  // if ($cookieStore.get('token')) {
  //   currentUser = userService.get();
  // }

  return $resource('/api/registryForContractors/:id/:action',{
    id : '@_id'},
    {
        
        createUserForContractorRequest: {
          method: 'POST'
        }
    }
);
});