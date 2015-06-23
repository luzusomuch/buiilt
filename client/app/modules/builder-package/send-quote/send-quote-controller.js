angular.module('buiiltApp').controller('SendQuoteBuilderPackageCtrl', function($scope, $stateParams, $cookieStore, $state, authService, userService, builderPackage, quoteRequetService, FileUploader) {
  $scope.builderPackage = builderPackage;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }
  $scope.user = {};
  /**
   * quote data
   */
  $scope.quote = {
    package: builderPackage._id
  };
  $scope.subTotalPrice = 0;
  $scope.subTotalRate = 0;
  $scope.user = {};
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

  $scope.submit = function() {
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
    }
    else {

      quoteRequetService.create({builderPackage: $scope.builderPackage,quoteRequest: $scope.quoteRequest, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise
        .then(function(data){
        $scope.success = data;
        alert('You have send quote successfully!');
        $state.go("team.manager");
      });
    }
  };

  /**
   * submit the quote
   * @returns {undefined}
   */
  // $scope.submit = function(){
  //   quoteRequetService.create($scope.quote).then(function(quote){
  //     alert('Send quote successfully.');

  //     //restart new one
  //     $scope.quote = {
  //       package: builderPackage._id
  //     };
  //   });
  // };

  $scope.signin = function () {
    authService.login($scope.user).then(function () {
      //show alert
      $state.reload();
    }, function (res) {
      $scope.errors = res;
    });
  };

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