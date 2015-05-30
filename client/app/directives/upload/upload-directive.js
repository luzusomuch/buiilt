'use strict';
angular.module('buiiltApp').directive('upload', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/upload/upload.html',
        scope:{
            project:'=',
            builderPackage: '='
        },
        controller: function($scope, $state, $cookieStore, $rootScope, $location , quoteService, userService, projectService, FileUploader, documentService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.formData = {
                date: new Date(),
                album: {},
                title: '',
                doc: {},
                desc: '',
                usersRelatedTo: []
            };
            $scope.docum = {};

            $scope.createDocument = function() {
                console.log($scope.docum);
                documentService.create({'id': $scope.project},$scope.docum).$promise.then(function(data) {
                    $scope.success = true;
                });
            };
            console.log($scope.builderPackage);
            documentService.getByProjectAndPackage({'id' : $scope.builderPackage}).$promise.then(function(data) {
                $scope.document = data;
            });

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
                url: 'api/uploads/'+ $scope.project + '/file',
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
                // console.log(fileItem);
                $state.reload();
            };

            uploader.onBeforeUploadItem = function (item) {
                $scope.formData.title = item.title;
                $scope.formData.doc = item.file.doc;
                $scope.formData.desc = item.file.desc || "";
                $scope.formData.usersRelatedTo = item.file.usersRelatedTo || "";
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
                $state.reload();
            };
        },
    }
});