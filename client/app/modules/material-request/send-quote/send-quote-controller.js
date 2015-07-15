angular.module('buiiltApp')
.controller('SendQuoteMaterialPackageCtrl', function($scope, $state, $stateParams,currentTeam, FileUploader, $cookieStore, authService, userService, materialRequest, materialRequestService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.materialRequest = materialRequest;
  $scope.currentTeam = currentTeam;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }

  if (_.findIndex(materialRequest.to, {_id:currentTeam._id}) == -1) {
    $state.go('team.manager');
  }

  $scope.subTotalPrice = 0;
  $scope.subTotalRate = 0;
  $scope.user = {};
  $scope.message = {};
  $scope.rate = {};
  $scope.price = {};
  $scope.lineWithRates = [];
  $scope.lineWithPrices = [];

  $scope.$watch('rate.lineWithRate',function(value) {
    $scope.subTotalRate = 0;
    if (value && value.rateTotal) {
      _.forEach(value.rateTotal, function (item) {

        if (!isNaN(item)) {
          $scope.subTotalRate += parseFloat(item);
        }
      })
    }

  },true)

  $scope.$watch('price.lineWithPrice',function(value) {
    $scope.subTotalPrice = 0;
    if (value && value.price) {
      _.forEach(value.price, function (item) {

        if (!isNaN(item)) {
          $scope.subTotalPrice += parseFloat(item);
        }
      })
    }

  },true);

  materialRequestService.getMessageForSupplier({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

  $scope.sendMessage = function() {
    materialRequestService.sendMessageToBuilder({id: $stateParams.packageId, team: $scope.currentTeam._id, message: $scope.message.message})
    .$promise.then(function(data) {
      $scope.messages = data;
      $scope.message.message = null;
    });
  };
  $scope.addLineWithRate = function() {
    $scope.lineWithRates.length = $scope.lineWithRates.length + 1;
  };
  $scope.addLineWithPrice = function() {
    $scope.lineWithPrices.length = $scope.lineWithPrices.length + 1;
  };

  $scope.removeLineWithRate = function(index) {
    $scope.lineWithRates.splice(index, 1);
    delete $scope.rate.lineWithRate.rateDescription[index];
    delete $scope.rate.lineWithRate.rate[index];
    delete $scope.rate.lineWithRate.rateQuantity[index];
    delete $scope.rate.lineWithRate.rateTotal[index];
  };
  $scope.removeLineWithPrice = function(index) {
    $scope.lineWithPrices.splice(index, 1);
    delete $scope.price.lineWithPrice.description[index];
    delete $scope.price.lineWithPrice.price[index];
    // delete $scope.rate.lineWithPrice.rateQuantity[index];
    // delete $scope.rate.lineWithPrice.rateTotal[index];
  };

  $scope.sendQuote = function() {
    if ($scope.rate.lineWithRate) {
      $scope.lineWithRates.push({
        description: $scope.rate.lineWithRate.rateDescription,
        rate: $scope.rate.lineWithRate.rate,
        quantity: $scope.rate.lineWithRate.rateQuantity,
        total: $scope.rate.lineWithRate.rate * $scope.rate.lineWithRate.rateQuantity
      });
    }
    if ($scope.price.lineWithPrice) {
      $scope.lineWithPrices.push({
        description: $scope.price.lineWithPrice.description,
        price: $scope.price.lineWithPrice.price,
        quantity: 1,
        total: $scope.price.lineWithPrice.price
      });
    }
    materialRequestService.sendQuote({materialRequest: $scope.materialRequest,quoteRequest: $scope.quoteRequest, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
      $scope.success = data;
      $scope.lineWithPrices = [];
      $scope.lineWithRates = [];
    });
  };

  $scope.closeSuccess = function() {
    $scope.success = false;
  };

  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
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
      $state.reload();
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