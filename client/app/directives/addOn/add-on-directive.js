'use strict';
angular.module('buiiltApp').directive('addon', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/addOn/addOn.html',
        scope: {
            package: '=',
            type: '@'
        },
        controller: function($scope, $state,$window, $stateParams, authService,addOnPackageService, FileUploader, $cookieStore, fileService, contractorRequestService, materialRequestService, variationRequestService) {
            $scope.allItemsText = 'All items';
            authService.getCurrentUser().$promise.then(function(data){
                $scope.currentUser = data;
                $scope.isStaff = (_.find($scope.package.staffs,{_id: data._id})) ? true: false;
            });
            $scope.currentTeam = authService.getCurrentTeam();
            
            // $scope.documents = [];
            fileService.getFileByStateParam({'id': $scope.package._id})
                .$promise.then(function(data) {
                $scope.documents = data;
                // $scope.packageItemArray = _.union($scope.package.variations, $scope.package.defects, $scope.package.invoices, data);
            });

            $scope.showDocuments = function() {
                // console.log($scope.documents);
                // $scope.files = $scope.abc;
                $scope.documents = $scope.documents;
                $scope.allItemsText = 'Documents';
            };

            $scope.showVariations = function() {
                $scope.package = $scope.package;
                $scope.allItemsText = 'Variations';
            };

            $scope.showDefects = function() {
                $scope.data = $scope.package;
                $scope.allItemsText = 'Defects';
            };

            $scope.showInvoices = function() {
                $scope.data = $scope.package;
                $scope.allItemsText = 'Invoices';
            };

            $scope.downloadFile = function(value) {
                fileService.downloadFile({id: value})
                .$promise.then(function(data){
                    $window.open(data.url);
                });
            };

            $scope.goToVariation = function(value) {
                variationRequestService.findOne({id: value._id}).$promise.then(function(data){
                    if ($scope.type == 'BuilderPackage') {
                        if (!data.to.isSelect) {
                            if ($scope.currentTeam.type == 'builder') {
                                $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                            }
                            else {
                                $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                            }
                        }
                        else {
                            $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                        }
                    }
                    else {
                        if (!data.to.isSelect) {
                            if ($scope.currentTeam.type == 'builder') {
                                $state.go('variationRequest.viewRequest',{id: data.project,variationId: data._id});
                            }
                            else {
                                $state.go('variationRequest.sendQuote',{id: data.project,variationId: data._id});
                            }
                        }
                        else {
                            $state.go('variationRequest.inProcess',{id: data.project,variationId: data._id});
                        }
                    }
                });
            };

            //send variation
            $scope.variation = {
                descriptions: []
            };
            $scope.quoteLater = true;
            $scope.addDescription = function(description){
                if (description) {
                    $scope.variation.descriptions.push(description);
                    $scope.description = '';
                }
            };
            $scope.removeDescription = function(index){
                $scope.variation.descriptions.splice(index,1);
            };
            $scope.$watchGroup(['variation.descriptions.length','submitted'],function(value) {
                $scope.descriptionError = (value[0] <= 0 && value[1])
            });
            $scope.sendVariation = function() {
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
                if ($scope.variation.title) {
                    addOnPackageService.sendVariation({id: $scope.package._id, 
                        quoteLater: $scope.quoteLater,
                        packageType: $scope.type, variation: $scope.variation,
                        rate: $scope.lineWithRates, price: $scope.lineWithPrices})
                    .$promise.then(function(data) {
                        $scope.package.variations.push(data);
                        // $scope.data = $scope.package.variations.push(data);
                        $scope.variation.title = null;
                        $scope.variation.descriptions = [];
                        $scope.lineWithRates = [];
                        $scope.lineWithPrices = [];
                      // $scope.messages = data;
                    });
                }
            };

            //send defect
            $scope.defect = {};
            $scope.sendDefect = function() {
                addOnPackageService.sendDefect({id: $scope.package._id, packageType: $scope.type, defect: $scope.defect})
                .$promise.then(function(data) {
                    $scope.data = data;
                    $scope.package.defects = data.defects;
                    $scope.defect = {};
                });
            };
            
            //send addendum
            $scope.addendum = {};
            $scope.addendumsScope = [];

            $scope.addAddendum = function() {
                $scope.addendumsScope.push({scopeDescription: $scope.addendum.scopeDescription, quantity: $scope.addendum.quantity});
                $scope.addendum.scopeDescription = null;
                $scope.addendum.quantity = null;
            };
            $scope.removeAddendum = function(index) {
                $scope.addendumsScope.splice(index, 1);
            };

            $scope.sendAddendum = function() {
                addOnPackageService.sendAddendum({id: $scope.package._id, 
                    packageType: $scope.package.packageType, description: $scope.addendum, 
                    addendumScope: $scope.addendumsScope})
                .$promise.then(function(data) {
                    $scope.addendums = data;
                    $scope.contractorRequest = data;
                    $scope.addendum = {};
                });
            };

            //send invoice
            $scope.invoice = {};
            $scope.subTotalPrice = 0;
            $scope.subTotalRate = 0;
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

            $scope.sendInvoice = function() {
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
                addOnPackageService.sendInvoice({id: $scope.package._id, packageType: $scope.type, invoice: $scope.invoice, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
                    $scope.data = data;
                    $scope.package.invoices = data.invoices;
                    $scope.lineWithPrices = [];
                    $scope.lineWithRates = [];
                    $scope.invoice = {};
                });
            };

            $scope.$watch('rate.lineWithRate',function(value) {
                $scope.subTotalRate = 0;
                if (value && value.rateTotal) {
                    _.forEach(value.rateTotal, function (item) {
                        if (!isNaN(item)) {
                            $scope.subTotalRate += parseFloat(item);
                        }
                    });
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
                title: '',
                belongToType: ''
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
                url: 'api/uploads/'+ $scope.package._id + '/file-package',
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
              fileService.getFileByStateParam({'id': $scope.package._id}).$promise.then(function(data) {
                  $scope.documents = data;
              });
            };
            uploader.onBeforeUploadItem = function (item) {

                $scope.formData._id = $scope.fileId;
                $scope.formData.title = item.title;
                $scope.formData.belongToType = $scope.type;
                item.formData.push($scope.formData);
            };

            var hideModalAfterUploading = false;
            $scope.uploadAll = function(){
                hideModalAfterUploading = true;
                uploader.uploadAll();
                Materialize.toast('<p style="width:300px;">Upload in progress</p><div class="progress"><div class="indeterminate"></div></div>',35000);
            };

            uploader.onCompleteAll = function () {
                if(hideModalAfterUploading){
                  // $modalInstance.close(newPhoto);
                }
                fileService.getFileByStateParam({'id': $scope.package._id}).$promise.then(function(data) {
                    $scope.documents = data;
                });
                $('.toast').css('opacity','0');
                Materialize.toast('Upload completed',3000);
            };
        }
    }
});