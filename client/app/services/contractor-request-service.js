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
      getMessageForContractor: {
        method: 'GET',
        params: {
          id: 'id',
          action: 'messagecontractor'
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
      }
    }
    );
  });