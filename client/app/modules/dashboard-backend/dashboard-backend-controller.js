angular.module('buiiltApp')
.controller('DashboardBackendCtrl', function($scope,$state, allDocuments, allUsers, allContractorPackages,allProjects) {
    $scope.allProjects = allProjects;
    $scope.contractorPackages = allContractorPackages;
    $scope.allUsers = allUsers;
    $scope.allDocuments = allDocuments;
});
