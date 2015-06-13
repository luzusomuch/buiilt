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
      }
      
    });
  });