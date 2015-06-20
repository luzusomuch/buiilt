angular.module('buiiltApp')
.factory('contractorService', function($resource) {
  return $resource('/api/contractors/:id/:action', {
    id: '@_id'},{
        createContractorPackage: {
            method: 'POST'
        },
        getProjectForContractor: {
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
                action: 'tenderbuilder'
            },
            isArray: true
        },
        getContractorPackageInProcessByProjectForBuilder: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processingbuilder'
            },
            isArray: true
        },
        getContractorPackageTenderByProjectForContractor: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'tendercontractor'
            },
            isArray: true
        },
        getContractorPackageInProcessByProjectForContractor: {
            method: 'GET',
            params: {
                id: 'id',
                action: 'processingcontractor'
            },
            isArray: true
        }
    });
});
