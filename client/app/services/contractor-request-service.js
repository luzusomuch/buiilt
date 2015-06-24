angular.module('buiiltApp')
  .factory('contractorRequestService', function ($resource) {
    return $resource('/api/contractorRequests/:id/:action', {
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
      sendInvitationInContractor: {
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
      sendVariation: {
        method: 'POST',
        params: {
          id: '@id',
          action: 'sendVariation'
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
      }
    }
    );
  });