angular.module('buiiltApp')
.factory('peopleService', function($rootScope, $q, $resource) {
    return $resource('/api/peoples/:id/:action',{id: '@_id'},
        {
            update: {
                method: 'PUT',
                params: {
                    action: 'invite'
                }
            },
            selectWinnerTender: {
                method: 'put',
                params: {
                    action: 'select-winner-tender'
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