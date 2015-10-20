angular.module('buiiltApp')
.factory('peopleService', function($rootScope, $q, $resource) {
    return $resource('/api/peoples/:id/:action',{id: '@_id'},
        {
            //invite people
            update: {
                method: 'PUT',
            }
        });
});