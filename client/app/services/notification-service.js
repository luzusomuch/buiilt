angular.module('buiiltApp').factory('notificationService', function($rootScope, $q, $resource) {
    return $resource('/api/notifications/:id/:action', {id : '@_id'}, {
        markItemsAsRead: {
            method: "GET",
            params: {
                action: "mark-items-as-read"
            }
        },
        get : {
            method : 'GET',
            isArray : true
        },
        markAsRead : {
            method : 'PUT',
            params : {
                action : 'mark-as-read'
            }
        },
        markAllAsRead : {
            method : 'PUT',
            isArray : true,
            params : {
                action : 'mark-all-as-read'
            }
        },
        getTotal : {
            method : 'GET',
            params : {
                action : 'get-total'
            }
        }
    });
});