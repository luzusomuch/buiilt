'use strict';
angular.module('buiiltApp').directive('file', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/file/file.html',
        scope:{
            project:'=',
        },
        controller: function($scope, $stateParams, $cookieStore, fileService,FileUploader, authService) {
            $scope.documents = [];
            $scope.files = [];
            $scope.file = {};
            $scope.isInterested = false;
            authService.getCurrentUser().$promise.then(function(data){
                $scope.currentUser = data;
                // fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                //     $scope.files = data;
                //     console.log($scope.files);
                //     _.each($scope.files, function(file){
                //         if (_.find(file.usersInterestedIn,{_id: $scope.currentUser._id})) {
                //             $scope.isInterested = true;
                //         }
                //         else {
                //             $scope.isInterested = false;
                //         }
                //     })
                // });
            });

            fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                $scope.files = data;
            });
                
            $scope.filterFunction = function(element) {
                return element.title.match(/^Ma/) ? true : false;
            };
            $scope.likeDocument = function(value) {
                fileService.interested({'id': value},{}).$promise.then(function(data) {
                    _.remove($scope.files, {_id: data._id});
                    $scope.files.push(data);
                });
            };
            $scope.disLikeDocument = function(value) {
                fileService.disinterested({'id': value},{}).$promise.then(function(data) {
                    _.remove($scope.files, {_id: data._id});
                    $scope.files.push(data);
                });
            };
            var fileId;
            var uploader = $scope.uploader = new FileUploader({
                url: 'api/uploads/'+ $stateParams.id + '/file',
                headers : {
                  Authorization: 'Bearer ' + $cookieStore.get('token')
                },
                formData: [$scope.formData]
            });
            $scope.getFileId = function(value) {
                var fileId = value;
                $scope.formData = {
                    fileId: '',
                    date: new Date(),
                    // album: {},
                    title: '',
                    // belongTo: {},
                    // doc: {},
                    desc: ''
                    // usersRelatedTo: []
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
                    fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                        $scope.files = data;
                    });
                };

                uploader.onBeforeUploadItem = function (item) {
                    $scope.formData._id = fileId;
                    $scope.formData.title = item.title;
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
                };

                uploader.onCompleteAll = function () {
                    alert('Upload successfully!');
                    if(hideModalAfterUploading){
                        // $modalInstance.close(newPhoto);
                    }
                    // $state.reload();
                    if ($stateParams.id) {
                        fileService.getFileByStateParam({'id': $stateParams.id}).$promise.then(function(data) {
                            $scope.files = data;
                        });    
                    }
                };
            };
        }
    }
});