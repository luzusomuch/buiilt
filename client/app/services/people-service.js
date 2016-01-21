angular.module('buiiltApp')
.factory('peopleService', function($rootScope, $q, $resource) {
    return $resource('/api/peoples/:id/:tenderId/:action',{id: '@_id', tenderId: '@_tenderId'},
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
            },
            getTender: {
                method: 'GET',
                params: {
                    action: 'get-tender'
                }
            },
            updateDistributeStatus: {
                method: "get",
                params: {
                    action: "update-distribute-status"
                }
            },
            attachAddendum: {
                method: "POST",
                params: {
                    action: "attach-addendum"
                }
            }
        });
});