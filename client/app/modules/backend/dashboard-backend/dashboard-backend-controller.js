angular.module('buiiltApp')
.controller('DashboardBackendCtrl', function($scope,$state, allTasks, allDocuments, allUsers, allMaterialPackages, allContractorPackages,allProjects) {
    $scope.allProjects = allProjects;
    $scope.contractorPackages = allContractorPackages;
    $scope.allMaterialPackages = allMaterialPackages;
    $scope.allUsers = allUsers;
    $scope.allDocuments = allDocuments;
    $scope.allTasks = allTasks;
});
