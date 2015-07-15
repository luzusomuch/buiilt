angular.module('buiiltApp')
.controller('SendQuoteContractorPackageCtrl', function($scope, $window, $state, currentTeam, $stateParams, $cookieStore, authService, userService, contractorRequest, contractorRequestService,FileUploader, registryForContractorService) {
  /**
   * quote data
   */
  $scope.quoteRequest = {};
  $scope.contractorRequest = contractorRequest;
  $scope.currentUser = {};
  if ($cookieStore.get('token')) {
    $scope.currentUser = userService.get();
  }
  $scope.currentTeam = currentTeam;
  if (_.findIndex(contractorRequest.to, {_id:currentTeam._id}) == -1) {
    $state.go('team.manager');
  }

  $scope.formData = {
      title: ''
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

  $scope.formData = {
    fileId: '',
    date: new Date(),
    title: '',
    desc: '',
    belongToType: '',
    usersRelatedTo: []
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

  contractorRequestService.getMessageForContractor({'id': $stateParams.packageId})
  .$promise.then(function(data) {
    $scope.messages = data;
  });

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
    contractorRequestService.sendQuote({contractorRequest: $scope.contractorRequest,quoteRequest: $scope.quoteRequest, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise
      .then(function(data){
      $scope.success = data;
      $scope.lineWithRates = [];
      $scope.lineWithPrices = [];
      // $state.go("team.manager");
    });
  };

  $scope.getSubTotal = function() {
    var subTotal = 0;
    return subTotal;
    // if ($scope.rate && $scope.rate !== null && $scope.rate.length > 0) {
    //   console.log($scope.rate);  
    //   $scope.$watch('rate', function(value) {
    //     if (value) {
    //       console.log(value);
    //     }
    //   }); 
    //   return subTotal;
    // }
    
    // $scope.$watch('rate.lineWithRate.rate', function(value) {
    //   console.log(value);
    // });
    // subTotal = $scope.rate.lineWithRate.rate;
    // return subTotal;
  };

  $scope.sendMessage = function() {
    if ($scope.message) {
      contractorRequestService.sendMessageToBuilder({id: $stateParams.packageId, team: $scope.currentTeam._id, message: $scope.message})
      .$promise.then(function(data) {
        $scope.messages = data;
        $scope.message = null;
      });
    }
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

  $scope.signupAndSendQuoteContractor = function () {
    $scope.user.idParams = $stateParams.id;
    $scope.user.quoteRequest = $scope.quoteRequest;
    registryForContractorService.createUserForContractorRequest($scope.user).$promise.then(function(data) {
      $scope.user = {
        allowNewsletter: true
      };
      alert('Registry successfully, please confirm your email!')
      $window.location.href = $scope.quoteRequest.project._id + '/dashboard';
    }, function(res) {
      $scope.errors = res.data;
    });
  };

});