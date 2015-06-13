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
      }
    }
    );
  });