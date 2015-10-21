angular.module('buiiltApp')
.factory('boardService', function($rootScope, $q, $resource) {
    return $resource('/api/boards/:id/:action',{id: '@_id'},
        {
            getBoards: {
                method: 'get',
                isArray: true
            },
            createBoard: {
                method: 'POST',
            },
            invitePeople: {
                method: 'put'
            },
            getInvitePeople: {
                method: 'get',
                params: {
                    action: 'get-invite-people'
                }
            }
        });
});