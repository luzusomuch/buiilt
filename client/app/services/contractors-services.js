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
        getContractorByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'projectb'
            },
            isArray: true
        },
        getContractorPackageTenderByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tenderb'
            },
            isArray: true
        },
        getContractorPackageInProcessByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processingb'
            },
            isArray: true
        },
        getContractorPackageTenderByProjectForContractor: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tenderc'
            },
            isArray: true
        },
        getContractorPackageInProcessByProjectForContractor: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processingc'
            },
            isArray: true
        }
    });
});
