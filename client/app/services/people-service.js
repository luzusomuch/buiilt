angular.module('buiiltApp')
.factory('peopleService', function($rootScope, $q, $resource) {
    return $resource('/api/peoples/:id/:action',{id: '@_id'},
        {
            //invite people
            update: {
                method: 'PUT',
            },
            getInvitePeople: {
                method: 'get',
                params: {
                    action: 'get-invite-people'
                }
            }
        });
});