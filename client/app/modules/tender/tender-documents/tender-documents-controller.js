angular.module('buiiltApp').controller('tenderDocumentsCtrl', function($rootScope, $scope, $q, $timeout, fileService, tender, $mdDialog, $mdToast, socket, tenderService) {
    $rootScope.title = "Document's " + tender.name;
    $scope.tender = tender;
    $scope.currentUser = $rootScope.currentUser;
    var prom = [];
	prom.push(fileService.getProjectFiles({id: tender.project, type: "document"}).$promise);
    prom.push(fileService.getProjectFiles({id: tender.project, type: "tender", tenderId: tender._id}).$promise);

    $q.all(prom).then(function(data) {
        $scope.tenderDocuments = _.union(data[0], data[1]);
    });

    socket.on("tender-document:inserted", function(data) {
        console.log(data);
        $scope.tenderDocuments.push(data);
    });

    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.pickFile = pickFile;

    $scope.onSuccess = onSuccess;

    function pickFile(){
        filepickerService.pick(
            onSuccess
        );
    };
    $scope.uploadFile = {};
    function onSuccess(file){
        file.type = "file";
        $scope.uploadFile.file = file;
    };

    $scope.uploadNewTenderDocument = function(form) {
        if (form.$valid) {
            if (!$scope.uploadFile.file) {
                $scope.showToast("You Haven\'t Select Any File");
                return false;
            }
            tenderService.uploadTenderDocument({id: tender._id}, $scope.uploadFile).$promise.then(function(res) {
                $scope.showToast("Insert New Document Successfully");
                $scope.closeModal();
            }, function(err){$scope.showToast("Error");});
        } else 
            $scope.showToast("Please Check Your Input!");
    };

    $scope.showModal = function(event, name) {
        $mdDialog.show({
            targetEvent: event,
            controller: 'tenderDocumentsCtrl',
            resolve: {
                tender: function($stateParams, tenderService) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }
            },
            templateUrl: 'app/modules/tender/tender-documents/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

});