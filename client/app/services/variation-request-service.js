angular.module('buiiltApp')
  .factory('variationRequestService', function ($resource) {
    return $resource('/api/variationRequests/:id/:action', {
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
      getQuoteRequestByContractorPackge: {
        method: 'GET',
        params: {
            id: 'id',
            action: 'view'
        },
        isArray: true
      },
      sendMessage: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'message'
        }
      },
      sendMessageToBuilder: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'send-message-to-builder'
        }
      },
      getMessageForBuilder: {
        method: 'GET',
        params: {
          id: 'id',
          action: 'message-builder'
        }
      },
      getMessageForContractor: {
        method: 'GET',
        params: {
          id: 'id',
          action: 'message-contractor'
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
      },
      cancelPackage: {
        method: 'PUT',
        params: {
          id: '@id',
          action: 'cancel-package'
        }
      },
      complete : {
        method : 'PUT',
        params : {
          action : 'complete'
        }
      },
      selectWinner: {
          method: 'GET',
          params: {
            id: 'id',
            action: 'select-winner'
          }
          // isArray: true
        },
      declineQuote: {
        method: 'PUT',
        params: {
          id: '@id',
          action: 'decline-quote'
        }
      }
    }
    );
  });