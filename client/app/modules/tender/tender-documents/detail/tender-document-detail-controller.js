angular.module('buiiltApp').controller('tenderDocumentDetailCtrl', function($rootScope, $scope, $q, $timeout, fileService, $mdDialog, $mdToast, socket, tenderService, document, uploadService, $stateParams) {
    $scope.document = document;
    $rootScope.title = "Tender Document " +$scope.document.name+ "Detail";
    function checkAcknowLedgement(document) {
        _.each(document.activities, function(activity) {
            if (activity.type === "upload-reversion") {
                if (_.findIndex(activity.acknowledgeUsers, function(item) {
                    if (item._id) {
                        return item._id._id == $rootScope.currentUser._id && item.isAcknow;
                    }
                }) !== -1) {
                    activity.isAcknow = true;
                } else {
                    activity.isAcknow = false;
                }
            }
        });
    };
    checkAcknowLedgement($scope.document);

    socket.emit("join", document._id);
    socket.on("document:update", function(data) {
        $scope.document = data;
        checkAcknowLedgement($scope.document);
    });

    $scope.openFileHistory = function($mdOpenMenu, event) {
        $mdOpenMenu(event);
    };

    $scope.acknowledgement = function(activity) {
        fileService.acknowledgement({id: $stateParams.documentId, activityId: activity._id}).$promise.then(function(res) {
            $scope.showToast("Sent acknowledgement to the owner successfully");
        }, function(err) {
            $scope.showToast("Error");
        });
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
                
                //Document Revision Uploaded
                mixpanel.identify($rootScope.currentUser._id);
                mixpanel.track("Document Revision Uploaded");
                
                $rootScope.$broadcast("Document.Updated", res);
            }, function(err) {$scope.showToast("There Has Been An Error...");});
        }
    };

    $scope.showModal = function($event, modalName) {
        $mdDialog.show({
            targetEvent: $event,
            controller: 'tenderDocumentDetailCtrl',
            resolve: {
                document: ["$stateParams", "fileService", function($stateParams, fileService) {
                    return fileService.get({id: $stateParams.documentId}).$promise;
                }]
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

    $scope.download = function() {
        filepicker.exportFile(
            {url: $scope.document.path, filename: $scope.document.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    }
});