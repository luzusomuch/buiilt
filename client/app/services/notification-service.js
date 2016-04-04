angular.module('buiiltApp')
    .factory('notificationService', function($rootScope, $q, $resource) {
    return $resource('/api/notifications/:id/:action', {id : '@_id'}, {
        markItemsAsRead: {
            method: "GET",
            params: {
                action: "mark-items-as-read"
            }
        },
        getAll: {
          method: 'GET',
          params: {
            action : 'list'
          },
          isArray: true
        },
        get : {
          method : 'GET',
          isArray : true
        },
        read : {
          method : 'PUT',
          params : {
            action : 'dashboard-read'
          }
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
        markReadByPackage : {
          method : 'PUT',
          isArray : true,
          params : {
            action : 'mark-read-by-package'
          }
        },
        create: {
          method: 'POST'
        },
        getMyFile: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'my-file'
          },
          isArray: true
        },
        getTotal : {
          method : 'GET',
          params : {
            action : 'get-total'
          }
        },
        readDocumentDashboard : {
          method : 'PUT',
          params : {
            action : 'dashboard-read-document'
          }
        },
        getAllChatMessageNotificationByBoard: {
          method: 'get', 
          params: {
            action: 'get-all-chat-by-board'
          },
          isArray: true
        },
        getAllChatMessageNotificationByUserInPeople: {
          method: 'get', 
          params: {
            action: 'get-all-chat-by-user-in-people'
          },
          isArray: true
        }
      }
    );
  });