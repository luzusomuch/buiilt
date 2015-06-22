angular.module('buiiltApp')
  .factory('materialRequestService', function ($resource) {
    return $resource('/api/materialRequests/:id/:action', {
      id: '@_id'},
    {
      sendQuote: {
        method: 'POST'
      },
      findOne: {
        method: 'GET',
        params: {
            id: 'id'
        }
      },
      getQuoteRequestByMaterialPackge: {
        method: 'GET',
        params: {
            id: 'id',
            action: 'view'
        },
        isArray: true
      },
      sendInvitationInMaterial: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'invite'
        }
      },
      sendMessage: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'message'
        }
      },
      getMessageForSupplier: {
        method: 'GET',
        params: {
          id: 'id',
          action: 'message-supplier'
        }
      },
      sendDefect: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'sendDefect'
        }
      },
      sendInvoice: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'sendInvoice'
        }
      },
      sendAddendum: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'send-addendum'
        }
      }
    });
  });