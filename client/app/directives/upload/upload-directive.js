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
            package: '=',
            type: '@',
            isQuote: '@'
        },
        controller: function($scope, $state, $cookieStore, $stateParams, $rootScope, $location, fileService, packageService, userService, projectService, FileUploader, documentService, filepickerService,uploadService) {
            $scope.uploadFile = {};
            $scope.pickFile = pickFile;

            $scope.onSuccess = onSuccess;

            function pickFile(){
                filepickerService.pick(
                    {mimetype: 'image/*'},
                    onSuccess
                );
            };

            function onSuccess(file){
                $scope.uploadFile = {
                    file: file,
                    _id: ($scope.fileId) ? $scope.fileId : '',
                    belongToType: ($scope.package) ? $scope.package.type : 'project',
                    tags: $scope.selectedTags,
                    isQuote: $scope.isQuote
                };
            };

            $scope.uploadNewDocument = function() {
                if ($stateParams.packageId) {
                    uploadService.uploadInPackage({id: $stateParams.packageId, file: $scope.uploadFile}).$promise.then(function(res){
                        $('#modal_attachDocument').closeModal();
                        $rootScope.newestDocument = res;
                        $state.reload();
                    });
                }
                else if($scope.package && $scope.package != '') {
                    uploadService.uploadInPackage({id: $scope.package._id, file: $scope.uploadFile}).$promise.then(function(res){
                        $('#modal_attachDocument').closeModal();
                        $rootScope.newestDocument = res;
                        $state.reload();
                    });
                }
                else {
                    uploadService.upload({id: $stateParams.id, file: $scope.uploadFile}).$promise.then(function(res){
                        $('#modal_attachDocument').closeModal();
                        $rootScope.newestDocument = res;
                        $state.reload();
                    });
                }
            };

            $scope.errors = {};
            $scope.success = {};
            $scope.file = {};
            $scope.formData = {
                fileId: '',
                date: new Date(),
                title: '',
                belongToType: '',
                desc: '',
                tags: []
            };
            $scope.tags = [];
            if ($scope.type == 'project') {
                $scope.tags = ['architectural','engineering','council','other'];
            }
            else if ($scope.type == 'package') {
                $scope.tags = ['quote','invoice','design','spec','other'];
            }

            $scope.selectedTags = [];
            $scope.selectTag = function(tag, index) {
                console.log(tag);
                $scope.selectedTags.push(tag);
                $scope.tags.splice(index,1);
            };

            $scope.deselect = function(tag, index) {
                $scope.tags.push(tag);
                $scope.selectedTags.splice(index,1);
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

            $scope.$watch('selectedTags.length',function(value) {
                $scope.tagsError = (value == 0) ? true : false;
            });

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
                // $state.reload();
                // fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                //     $scope.files = data;
                // });
            };
            uploader.onBeforeUploadItem = function (item) {
                $scope.formData._id = $scope.fileId;
                // $scope.formData.title = item.title;
                $scope.formData.belongToType =  ($scope.package) ? $scope.package.type : 'project';
                $scope.formData.tags = $scope.selectedTags;
                $scope.formData.isQuote = $scope.isQuote;
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
            $scope.uploadAll = function(form){
                if (form.$valid && !$scope.tagsError) {
                    hideModalAfterUploading = true;
                    $('#attachDocument').closeModal();
                    $('#modal_attachDocument').closeModal();
                    Materialize.toast('<p style="width:300px;">Upload in progress</p><div class="progress"><div class="indeterminate"></div></div>',35000);    
                    uploader.uploadAll();
                }
            };

            uploader.onCompleteAll = function () {
                if(hideModalAfterUploading){
                    // $modalInstance.close(newPhoto);
                }
                // $state.reload();
                if ($scope.type == 'project') {
                    fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                        $scope.files = data;
                        $rootScope.newestDocument = _.last(data);
                        $state.reload();
                    });    
                }
                else {
                    fileService.getFileByStateParam({'id': $scope.package._id}).$promise.then(function(data) {
                        $scope.files = data;
                        $rootScope.newestDocument = _.last(data);
                        $state.reload();
                    });       
                }
                $('.toast').css('opacity','0');
                Materialize.toast('Upload completed',3000);
            };
        }
    };
});