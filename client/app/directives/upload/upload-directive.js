'use strict';
angular.module('buiiltApp').directive('upload', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/upload/upload.html',
        scope:{
            project:'=',
            builderPackage: '=',
            documentId : '=',
            fileId: '=',
            package: '='
        },
        controller: function($scope, $state, $cookieStore, $stateParams, $rootScope, $location, fileService, packageService, userService, projectService, FileUploader, documentService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.file = {};
            $scope.formData = {
                fileId: '',
                date: new Date(),
                title: '',
                belongToType: '',
                desc: ''
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

            if ($stateParams.packageId) {
                var uploader = $scope.uploader = new FileUploader({
                    url: 'api/uploads/'+ $stateParams.packageId + '/file-package',
                    headers : {
                      Authorization: 'Bearer ' + $cookieStore.get('token')
                    },
                    formData: [$scope.formData]
                });
            }
            else if($scope.package && $scope.package != '') {
                var uploader = $scope.uploader = new FileUploader({
                    url: 'api/uploads/'+ $scope.package._id + '/file-package',
                    headers : {
                      Authorization: 'Bearer ' + $cookieStore.get('token')
                    },
                    formData: [$scope.formData]
                });
            }
            else {
                var uploader = $scope.uploader = new FileUploader({
                    url: 'api/uploads/'+ $stateParams.id + '/file',
                    headers : {
                      Authorization: 'Bearer ' + $cookieStore.get('token')
                    },
                    formData: [$scope.formData]
                });
            }

              // CALLBACKS
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
                // $scope.formData.title = item.title;
                $scope.formData.belongToType =  ($scope.package) ? $scope.package.type : '';
                // $scope.formData.belongTo = $stateParams.id;
                // $scope.formData.doc = $scope.documentId;
                // $scope.formData.desc = item.file.desc || "";
                // $scope.formData.usersRelatedTo = item.file.usersRelatedTo || "";
                //angular.forEach(item.file.tags, function (tag) {
                //  $scope.formData.tags.push(tag.text);
                //});
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
                // $state.reload();
                if ($stateParams.id) {
                    fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                        $scope.files = data;
                    });    
                }
                else {
                    fileService.getFileByStateParam({'id': $stateParams.packageId}).$promise.then(function(data) {
                        $scope.files = data;
                    });       
                }
                $('.toast').css('opacity','0');
                Materialize.toast('Upload completed',3000);
            };
        },
    }
});