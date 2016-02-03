angular.module('buiiltApp').controller('projectDocumentationDetailCtrl', function($rootScope, $scope, document, uploadService, $mdDialog, $mdToast, $stateParams, fileService) {
    $scope.document = document;
    $rootScope.$on("Document.Updated", function(event, data) {
        setUploadReversion();
        $scope.document = data;
    });

    $scope.acknowledgement = function() {
        fileService.acknowledgement({id: $stateParams.documentId}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
            $rootScope.$broadcast("Document.Updated", res);
        }, function(err) {
            $scope.showToast("Error");
        });
    };

    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    $scope.openHistoryDetail = function($event, history) {
        $mdDialog.show({
            targetEvent: $event,
            controller: function($scope) {
                $scope.history = history;
                console.log($scope.history);
                $scope.closeModal = function() {
                    $mdDialog.cancel();
                };

                $scope.downloadFile = function() {
                    filepicker.exportFile(
                        {url: $scope.history.link, filename: $scope.history.name},
                        function(Blob){
                            console.log(Blob.url);
                        }
                    );
                };
            },
            templateUrl: 'app/modules/project/project-files/detail/partials/file-history-detail.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

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
                $rootScope.$broadcast("Document.Updated", res);
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