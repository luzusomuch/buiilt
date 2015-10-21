angular.module('buiiltApp')
.factory('peopleChatService', function($rootScope, $q, $resource) {
    return $resource('/api/peopleChats/:id/:action',{id: '@_id'},
        {
            selectPeople: {
                method: 'post',
                params: {
                    action: 'select-people'
                }
            }, 
            sendMessage: {
                method: 'post',
                params: {
                    action: 'send-message'
                }
            }
        });
});