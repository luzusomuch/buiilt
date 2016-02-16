angular.module('buiiltApp').controller('tenderDocumentsCtrl', function($rootScope, $scope, $q, $timeout, fileService, tender) {
    var prom = [];
	prom.push(fileService.getProjectFiles({id: tender.project, type: "document"}).$promise);
    prom.push(fileService.getProjectFiles({id: tender.project, type: "tender"}).$promise);

    $q.all(prom).then(function(data) {
        console.log(data);
    });

});