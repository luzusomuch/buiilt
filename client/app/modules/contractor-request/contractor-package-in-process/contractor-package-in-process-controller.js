angular.module('buiiltApp')
.controller('ContractorPackageInProcessCtrl', function($scope, $state, $stateParams, FileUploader, currentTeam, $cookieStore, fileService, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  // $scope.allItemsText = 'All items';
  $scope.currentTeam = currentTeam;
  $scope.contractorRequest = contractorRequest;
  // $scope.documents = [];
  
  // fileService.getFileByStateParam({'id': $stateParams.packageId})
  // .$promise.then(function(data) {
  //   $scope.documents = data;
  // });
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  // contractorRequestService.getMessageForBuilder({'id': $stateParams.packageId})
  // .$promise.then(function(data) {
  //   $scope.messages = data;
  // });

  // $scope.showAll = function() {
  //   $scope.contractorRequest = $scope.contractorRequest;
  //   $scope.allItemsText = 'All items';
  //   console.log($scope.allItemsText);
  // };

  // $scope.showVariations = function() {
  //   $scope.variations = $scope.contractorRequest;
  //   $scope.allItemsText = 'Variations';
  // };

  // $scope.showDefects = function() {
  //   $scope.defects = $scope.contractorRequest;
  //   $scope.allItemsText = 'Defects';
  // };

  // $scope.showInvoices = function() {
  //   $scope.invoices = $scope.contractorRequest;
  //   $scope.allItemsText = 'Invoices';
  // };

  // $scope.showDocument = function() {
  //   $scope.files = $scope.documents;
  //   $scope.allItemsText = 'Documents';
  // };

  // $scope.sendMessage = function() {
  //   contractorRequestService.sendMessage({id: $stateParams.packageId, message: $scope.message})
  //   .$promise.then(function(data) {
  //     $scope.messages = data;
  //     alert('Send message successfully!');
  //   });
  // };

<<<<<<< HEAD
  // $scope.sendVariation = function() {
  //   contractorRequestService.sendVariation({id: $stateParams.packageId, variation: $scope.variation})
  //   .$promise.then(function(data) {
  //     $scope.variations = data;
  //     $scope.contractorRequest = data;
  //     $scope.variation = {};
  //     alert('Send variation successfully!');
  //   });
  // };

  // $scope.sendDefect = function() {
  //   contractorRequestService.sendDefect({id: $stateParams.packageId, defect: $scope.defect})
  //   .$promise.then(function(data) {
  //     $scope.defects = data;
  //     $scope.contractorRequest = data;
  //     $scope.defect = {};
  //     alert('Send defect successfully!');
  //   });
  // };
=======
  $scope.sendVariation = function() {
    contractorRequestService.sendVariation({id: $stateParams.packageId, variation: $scope.variation})
    .$promise.then(function(data) {
      $scope.variations = data;
      $scope.contractorRequest = data;
      $scope.variation = {};
      alert('Send variation successfully!');
    });
  };

  $scope.sendDefect = function() {
    contractorRequestService.sendDefect({id: $stateParams.packageId, defect: $scope.defect})
    .$promise.then(function(data) {
      $scope.defects = data;
      $scope.contractorRequest = data;
      $scope.defect = {};
      alert('Send defect successfully!');
    });
  };
>>>>>>> [-] Fix something in staff package

  //Send invoice
  // $scope.subTotalPrice = 0;
  // $scope.subTotalRate = 0;
  // $scope.rate = {};
  // $scope.price = {};
  // $scope.lineWithRates = [];
  // $scope.lineWithPrices = [];

  // $scope.addLineWithRate = function() {
  //   $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
  // };
  // $scope.addLineWithPrice = function() {
  //   $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
  // };

  // $scope.removeLineWithRate = function(index) {
  //   $scope.lineWithRates.splice(index, 1);
  // };
  // $scope.removeLineWithPrice = function(index) {
  //   $scope.lineWithPrices.splice(index, 1);
  // };

  // $scope.sendInvoice = function() {
  //   $scope.lineWithRates.push({
  //     description: $scope.rate.lineWithRate.rateDescription,
  //     rate: $scope.rate.lineWithRate.rate,
  //     quantity: $scope.rate.lineWithRate.rateQuantity,
  //     total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
  //   });
  //   $scope.lineWithPrices.push({
  //     description: $scope.price.lineWithPrice.description,
  //     price: $scope.price.lineWithPrice.price,
  //     quantity: 1,
  //     total: $scope.price.lineWithPrice.price
  //   });
  //   if ($scope.lineWithPrices.length == 0 || $scope.lineWithRates.length == 0) {
  //     alert('Please review your quote');
  //   }
  //   else {
  //     contractorRequestService.sendInvoice({id: $stateParams.packageId, invoice: $scope.invoice, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
  //       $scope.invoices = data;
  //       $scope.contractorRequest = data;
  //       alert('You have send invoice successfully!');
  //     });
  //   }
  // };

  // $scope.$watch('rate.lineWithRate',function(value) {
  //   $scope.subTotalRate = 0;
  //   if (value && value.rateTotal) {
  //     _.forEach(value.rateTotal, function (item) {

  //       if (!isNaN(item)) {
  //         $scope.subTotalRate += parseFloat(item);
  //       }
  //     })
  //   }

  // },true)

  // $scope.$watch('price.lineWithPrice',function(value) {
  //   $scope.subTotalPrice = 0;
  //   if (value && value.price) {
  //     _.forEach(value.price, function (item) {

  //       if (!isNaN(item)) {
  //         $scope.subTotalPrice += parseFloat(item);
  //       }
  //     })
  //   }

  // },true);

  //upload file
  // $scope.formData = {
  //     title: ''
  // };
  // $scope.safeApply = function (fn) {
  //   var phase = this.$root.$$phase;
  //   if (phase == '$apply' || phase == '$digest') {
  //     if (fn && (typeof (fn) === 'function')) {
  //       fn();
  //     }
  //   } else {
  //     this.$apply(fn);
  //   }
  // };

  // var uploader = $scope.uploader = new FileUploader({
  //   url: 'api/uploads/'+ $stateParams.packageId + '/file-package',
  //   headers : {
  //     Authorization: 'Bearer ' + $cookieStore.get('token')
  //   },
  //   formData: [$scope.formData]
  // });
  // uploader.onProgressAll = function (progress) {
  //     $scope.progress = progress;
  // };
  // uploader.onAfterAddingFile = function (item) {
  //     //item.file.name = ''; try to change file name
  //     var reader = new FileReader();

  //     reader.onload = function (e) {
  //         item.src = e.target.result;
  //         $scope.safeApply();
  //     };

  //     reader.readAsDataURL(item._file);
  // };
  // var newPhoto = null;
  // uploader.onCompleteItem = function (fileItem, response, status, headers) {
  //     newPhoto = response;
  //     // $state.reload();
  //     // fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
  //     //     $scope.files = data;
  //     // });
  // };

  // uploader.onBeforeUploadItem = function (item) {
  //     $scope.formData._id = $scope.fileId;
  //     $scope.formData.title = item.title;
  //     item.formData.push($scope.formData);
  // };

  // var hideModalAfterUploading = false;
  // $scope.uploadAll = function(){
  //     hideModalAfterUploading = true;
  //     uploader.uploadAll();
  // };

  // uploader.onCompleteAll = function () {
  //     if(hideModalAfterUploading){
  //         // $modalInstance.close(newPhoto);
  //     }
  //     // $state.reload();
  // };

});