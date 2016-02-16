angular.module('buiiltApp')
.factory('tenderService', function($resource) {

    return $resource('/api/tenders/:id/:activityId/:action',
    {
        id : '@_id'
    },
    {
        getAll: {
            method: 'GET',
            params: {
                action: "get-all"
            },
            isArray: true
        },
        get: {
            method: "GET"
        },
        create: {
            method: "POST"
        },
        update: {
            method: "PUT"
        },
        acknowledgement: {
            method: "PUT",
            params: {
                action: "acknowledgement"
            }
        },
        uploadTenderDocument: {
            method: "POST",
            params: {
                action: "upload-tender-document"
            }
        },
        updateTenderInvitee: {
            method: "PUT",
            params: {
                action: "update-tender-invitee"
            }
        },
        selectWinner: {
            method: "GET",
            params: {
                action: "select-winner"
            }
        }
    });
});