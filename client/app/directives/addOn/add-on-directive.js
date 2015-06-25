'use strict';
angular.module('buiiltApp').directive('addon', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/addOn/addOn.html',
        scope: {
            package: '='
        },
        controller: function($scope, authService,addOnPackageService, FileUploader, $cookieStore, fileService, contractorRequestService, materialRequestService) {
            $scope.allItemsText = 'All items';
            $scope.currentTeam = authService.getCurrentTeam();
            $scope.documents = [];
            fileService.getFileByStateParam({'id': $scope.package._id})
                .$promise.then(function(data) {
                $scope.documents = data;
            });

            $scope.showDocument = function() {
                $scope.files = $scope.documents;
                $scope.allItemsText = 'Documents';
            };

            $scope.showVariations = function() {
                $scope.variations = $scope.package;
                $scope.allItemsText = 'Variations';
            };

            $scope.showDefects = function() {
                $scope.defects = $scope.package;
                $scope.allItemsText = 'Defects';
            };

            $scope.showInvoices = function() {
                $scope.invoices = $scope.package;
                $scope.allItemsText = 'Invoices';
            };

            // if ($scope.package.packageType == 'contractor') {
            //     contractorRequestService.findOne({'id': $scope.package._id}).$promise.then(function(data){
            //         $scope.contractorRequest = data;
            //     });
            //     $scope.showVariations = function() {
            //         $scope.variations = $scope.contractorRequest;
            //         $scope.allItemsText = 'Variations';
            //     };

            //     $scope.showDefects = function() {
            //         $scope.defects = $scope.contractorRequest;
            //         $scope.allItemsText = 'Defects';
            //     };

            //     $scope.showInvoices = function() {
            //         $scope.invoices = $scope.contractorRequest;
            //         $scope.allItemsText = 'Invoices';
            //     };
            // }
            // else if($scope.package.packageType == 'material') {
            //     materialRequestService.findOne({id: $scope.package._id}).$promise.then(function(data) {
            //         $scope.materialRequest = data;
            //     });
            //     $scope.showDefects = function() {
            //         $scope.defects = $scope.materialRequest;
            //         $scope.allItemsText = 'Defects';
            //     };

            //     $scope.showInvoices = function() {
            //         $scope.invoices = $scope.materialRequest;
            //         $scope.allItemsText = 'Invoices';
            //     };
            // }
            
            
            
            

            //send variation
            $scope.variation = {};
            $scope.sendVariation = function() {
                addOnPackageService.sendVariation({id: $scope.package._id, packageType: $scope.package.packageType, variation: $scope.variation})
                .$promise.then(function(data) {
                    $scope.variations = data;
                    $scope.package.variations = data.variations;
                    $scope.variation = {};
                    alert('Send variation successfully!');
                  // $scope.messages = data;
                });
            };

            //send defect
            $scope.defect = {};
            $scope.sendDefect = function() {
                addOnPackageService.sendDefect({id: $scope.package._id, packageType: $scope.package.packageType, defect: $scope.defect})
                .$promise.then(function(data) {
                    $scope.defects = data;
                    $scope.package.defects = data.defects;
                    $scope.defect = {};
                    alert('Send defect successfully!');
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
                    alert('Send Addendum successfully!');
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
                }
                else {
                    addOnPackageService.sendInvoice({id: $scope.package._id, packageType: $scope.package.packageType, invoice: $scope.invoice, rate: $scope.lineWithRates, price: $scope.lineWithPrices}).$promise.then(function(data){
                        $scope.invoices = data;
                        $scope.package.invoices = data.invoices;
                        alert('You have send invoice successfully!');
                    });
                }
            };

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
        }
    }
});