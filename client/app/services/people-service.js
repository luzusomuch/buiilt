angular.module('buiiltApp').factory('peopleService', function($rootScope, $q, $resource) {
    return $resource('/api/peoples/:id/:tenderId/:action',
        {id: '@_id', tenderId: '@_tenderId'},
        {
            update: {
                method: 'PUT',
                params: {
                    action: 'invite'
                }
            },
            getInvitePeople: {
                method: 'get',
                params: {
                    action: 'get-invite-people'
                }
            }
        });
});