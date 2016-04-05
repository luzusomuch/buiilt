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
            },
            updateTender: {
                method: "PUT",
                params: {
                    action: "update-tender"
                }
            },
            submitATender: {
                method: "POST",
                params: {
                    action: "submit-a-tender"
                }
            },
            createRelatedItem: {
                method: "PUT",
                params: {
                    action: "create-related-item"
                }
            },
            acknowledgement: {
                method: "GET",
                params: {
                    action: "acknowledgement"
                }
            }
        });
});