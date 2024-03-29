angular.module('buiiltApp').controller('tenderDocumentsCtrl', function($rootScope, $scope, $q, $timeout, fileService, tender, $mdDialog, $mdToast, socket, tenderService) {
    $rootScope.title = "Document's " + tender.name;
    $scope.tender = tender;
    $scope.currentUser = $rootScope.currentUser;
    var prom = [];
	prom.push(fileService.getProjectFiles({id: tender.project, type: "document"}).$promise);
    prom.push(fileService.getProjectFiles({id: tender.project, type: "tender", tenderId: tender._id}).$promise);

    $scope.tenderDocuments = [];
    /*Get all file related to document and tender for current user in selected project*/
    $q.all(prom).then(function(data) {
        $scope.tenderDocuments = _.union(data[0], data[1]);
    });

    /*Receive when tender-document inserted*/
    socket.on("tender-document:inserted", function(data) {
        $scope.tenderDocuments.push(data);
    });

    /*Show toast dialog*/
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

    /*Upload new tender document*/
    $scope.uploadNewTenderDocument = function(form) {
        if (form.$valid) {
            if (!$scope.uploadFile.file) {
                $scope.showToast("You Need To Select a File...");
                return false;
            }
            tenderService.uploadTenderDocument({id: tender._id}, $scope.uploadFile).$promise.then(function(res) {
                $scope.showToast("New Document Has Been Attached Successfully.");
                $scope.closeModal();
            }, function(err){$scope.showToast("There Has Been An Error...");});
        } else 
            $scope.showToast("Please Check Your Input...");
    };

    /*Show modal with valid name*/
    $scope.showModal = function(event, name) {
        $mdDialog.show({
            targetEvent: event,
            controller: 'tenderDocumentsCtrl',
            resolve: {
                tender: ["$stateParams", "tenderService", function($stateParams, tenderService) {
                    return tenderService.get({id: $stateParams.tenderId}).$promise;
                }]
            },
            templateUrl: 'app/modules/tender/tender-documents/'+name,
            parent: angular.element(document.body),
            clickOutsideToClose: false
        });
    };

    /*Close opening model*/
    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    /*View latest file history in new window*/
    $scope.showViewFileModal = function($event, file) {
        var win = window.open(_.last(file.fileHistory).link, "_blank");
        win.focus();
    };

});