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
        },
        getContractorByProject: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'project'
            },
            isArray: true
        },
        getContractorPackageTenderByProject: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tender'
            },
            isArray: true
        },
        getContractorPackageInProcessByProject: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processing'
            },
            isArray: true
        }
    });
});
