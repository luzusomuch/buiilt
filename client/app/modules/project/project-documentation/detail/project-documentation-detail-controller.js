angular.module('buiiltApp').controller('projectDocumentationDetailCtrl', function($rootScope, $scope, document, uploadService, $mdDialog, $mdToast, $stateParams) {
    $scope.document = document;
    $rootScope.$on("Document.Upload-Reversion", function(event, data) {
        setUploadReversion();
        $scope.document = data;
    });

    function setUploadReversion() {
        $scope.uploadReversion = {
            files: []
        };
        $scope.allowUploadReversion = ($scope.document.owner._id == $rootScope.currentUser._id) ? true : false;
    };

    setUploadReversion();

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };

    function onSuccess(file){
        $scope.uploadReversion.files.push(file);
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    $scope.uploadReversionDocument = function() {
        if ($scope.uploadReversion.files.length === 0) {
            $scope.showToast("Please Select a File to Upload...");
            return;
        } else {
            uploadService.uploadReversion({id: $scope.document._id}, $scope.uploadReversion).$promise.then(function(res) {
                $scope.closeModal();
                $scope.showToast("Document Revision Successfully Uploaded.");
                $rootScope.$broadcast("Document.Upload-Reversion", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    $scope.showModal = function($event, modalName) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'projectDocumentationDetailCtrl',
            resolve: {
                document: function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }
            },
            templateUrl: 'app/modules/project/project-documentation/detail/' + modalName,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','right').hideDelay(3000));
    };

    $scope.download = function(name, link) {
        filepicker.exportFile(
            {url: link, filename: name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    }
});