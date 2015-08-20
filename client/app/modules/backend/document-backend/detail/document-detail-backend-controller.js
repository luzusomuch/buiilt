angular.module('buiiltApp').controller('DocumentDetailBackendCtrl', function($scope, document, fileService) {
    $scope.document = document;


    $scope.remove = function(value){
        fileService.delete({'id': value._id}).$promise.then(function(documents){
            data = documents;
        })
    };
});