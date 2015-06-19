'use strict';
angular.module('buiiltApp').directive('upload', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/upload/upload.html',
        scope:{
            project:'=',
            builderPackage: '=',
            documentId : '=',
            fileId: '='
        },
        controller: function($scope, $state, $cookieStore, $stateParams, $rootScope, $location, fileService, packageService, userService, projectService, FileUploader, documentService) {

            $scope.errors = {};
            $scope.success = {};
            $scope.formData = {
                fileId: '',
                date: new Date(),
                // album: {},
                title: '',
                belongTo: {},
                // doc: {},
                desc: '',
                usersRelatedTo: []
            };
            // $scope.docum = {};
            // packageService.getPackageByProject({'id': $stateParams.id}, function(data) {
            //     documentService.getByProjectAndPackage({'id' : data._id}).$promise.then(function(data) {
            //         $scope.document = data;
            //     });
            // });

            // $scope.createDocument = function() {
            //     documentService.create({'id': $scope.project},$scope.docum).$promise.then(function(data) {
            //         $scope.success = true;
            //     });
            // };
            // documentService.getByProjectAndPackage({'id' : $scope.builderPackage}).$promise.then(function(data) {
            //     $scope.document = data;
            // });

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
                url: 'api/uploads/'+ $stateParams.id + '/file',
                headers : {
                  Authorization: 'Bearer ' + $cookieStore.get('token')
                },
                formData: [$scope.formData]
            });

            // uploader.filters.push({
            //     name: 'imageFilter',
            //     fn: function (item /*{File|FileLikeObject}*/, options) {
            //       var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            //       return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            //     }
            // });

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
                $scope.formData.title = item.title;
                $scope.formData.belongTo = $stateParams.id;
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
            };

            uploader.onCompleteAll = function () {
                if(hideModalAfterUploading){
                    // $modalInstance.close(newPhoto);
                }
                // $state.reload();
            };
        },
    }
});