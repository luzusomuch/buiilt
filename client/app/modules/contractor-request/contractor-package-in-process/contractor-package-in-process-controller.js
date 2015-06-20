angular.module('buiiltApp')
.controller('ContractorPackageInProcessCtrl', function($scope, $state, $stateParams, FileUploader, currentTeam, $cookieStore, fileService, authService, userService, contractorRequest, contractorRequestService, quoteService) {
  /**
   * quote data
   */
  $scope.currentTeam = currentTeam;
  $scope.contractorRequest = contractorRequest;
  $scope.variation = {};
  $scope.defect = {};
  $scope.invoice = {};
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  contractorRequestService.getMessageForContractor({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.showVariations = function() {
  contractorRequestService.findOne({'id': $stateParams.packageId})
    .$promise.then(function(data) {
      $scope.variations = data;
    });
  };

  $scope.showDefects = function() {
  contractorRequestService.findOne({'id': $stateParams.packageId})
    .$promise.then(function(data) {
      $scope.defects = data;
    });
  };

  $scope.showInvoices = function() {
  contractorRequestService.findOne({'id': $stateParams.packageId})
    .$promise.then(function(data) {
      $scope.invoices = data;
    });
  };

  $scope.showDocument = function() {
    fileService.getFileByStateParam({'id': $stateParams.packageId})
    .$promise.then(function(data) {
      $scope.files = data;
    });
  };

  $scope.sendMessage = function() {
    contractorRequestService.sendMessage({id: $stateParams.packageId, message: $scope.message})
    .$promise.then(function(data) {
      $scope.messages = data;
    });
  };

  $scope.sendVariation = function() {
    contractorRequestService.sendVariation({id: $stateParams.packageId, variation: $scope.variation})
    .$promise.then(function(data) {
      $scope.variations = data;
    });
  };

  $scope.sendDefect = function() {
    contractorRequestService.sendDefect({id: $stateParams.packageId, defect: $scope.defect})
    .$promise.then(function(data) {
      $scope.defects = data;
    });
  };

  //Send invoice
  $scope.rate = {};
  $scope.price = {};
  $scope.lineWithRates = [];
  $scope.lineWithPrices = [];

  $scope.addLineWithRate = function() {
    $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
  };
  $scope.addLineWithPrice = function() {
    $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
  };

  $scope.removeLineWithRate = function(index) {
    $scope.lineWithRates.splice(index, 1);
  };
  $scope.removeLineWithPrice = function(index) {
    $scope.lineWithPrices.splice(index, 1);
  };

  $scope.sendInvoice = function() {
    $scope.lineWithRates.push({
      description: $scope.rate.lineWithRate.rateDescription,
      rate: $scope.rate.lineWithRate.rate,
      quantity: $scope.rate.lineWithRate.rateQuantity,
      total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
    });
    $scope.lineWithPrices.push({
      description: $scope.price.lineWithPrice.description,
      price: $scope.price.lineWithPrice.price,
      quantity: 1,
      total: $scope.price.lineWithPrice.price
    });
    if ($scope.lineWithPrices.length == 0 || $scope.lineWithRates.length == 0) {
      alert('Please review your quote');
      return;
    }
    else {
      contractorRequestService.sendInvoice({id: $stateParams.packageId, invoice: $scope.invoice, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
        $scope.success = data;
        alert('You have send invoice successfully!');
      });
    }
  };

  //upload file
  $scope.formData = {
      title: ''
  };
  $scope.safeApply = function (fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  var uploader = $scope.uploader = new FileUploader({
    url: 'api/uploads/'+ $stateParams.packageId + '/file-package',
    headers : {
      Authorization: 'Bearer ' + $cookieStore.get('token')
    },
    formData: [$scope.formData]
  });
  uploader.onProgressAll = function (progress) {
      $scope.progress = progress;
  };
  uploader.onAfterAddingFile = function (item) {
      //item.file.name = ''; try to change file name
      var reader = new FileReader();

      reader.onload = function (e) {
          item.src = e.target.result;
          $scope.safeApply();
      };

      reader.readAsDataURL(item._file);
  };
  var newPhoto = null;
  uploader.onCompleteItem = function (fileItem, response, status, headers) {
      newPhoto = response;
      // $state.reload();
      // fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
      //     $scope.files = data;
      // });
  };

  uploader.onBeforeUploadItem = function (item) {
      $scope.formData._id = $scope.fileId;
      $scope.formData.title = item.title;
      item.formData.push($scope.formData);
  };

  var hideModalAfterUploading = false;
  $scope.uploadAll = function(){
      hideModalAfterUploading = true;
      uploader.uploadAll();
  };

  uploader.onCompleteAll = function () {
      if(hideModalAfterUploading){
          // $modalInstance.close(newPhoto);
      }
      // $state.reload();
  };

});