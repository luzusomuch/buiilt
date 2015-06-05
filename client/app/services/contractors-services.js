angular.module('buiiltApp')
.factory('contractorService', function($resource) {
  return $resource('/api/contractors/:id/:action', {
    id: '@_id'},{
        createContractorPackage: {
            method: 'POST'
        },
        getProjectForContractorWhoWinner: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'winner'
            },
            isArray: true
        }
    });
});
