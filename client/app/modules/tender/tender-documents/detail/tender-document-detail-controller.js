angular.module('buiiltApp').controller('tenderDocumentDetailCtrl', function($rootScope, $scope, $q, $timeout, fileService, tender, $mdDialog, $mdToast, socket, tenderService, document) {
    $scope.document = document;

    $scope.download = function() {
        filepicker.exportFile(
            {url: $scope.document.path, filename: $scope.document.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    }
});