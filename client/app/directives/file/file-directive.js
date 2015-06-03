'use strict';
angular.module('buiiltApp').directive('file', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/file/file.html',
        scope:{
            project:'=',
        },
        controller: function($scope, $rootScope, $cookieStore, userService, $location, documentService, packageService, fileService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
            $scope.documents = [];
            $scope.files = [];
            $scope.file = {};
            $scope.currentUser = {};
            if ($cookieStore.get('token')) {
                $scope.currentUser = userService.get();
            }

            packageService.getPackageByProject({'id':$scope.project}).$promise.then(function(data) {
                $scope.packageItem = data;
                documentService.getByProjectAndPackage({'id':$scope.packageItem._id}).$promise.then(function(data) {
                    if (data !== null) {
                        $scope.documents = data;
                    }
                });
            });
                    // if (data !== null) {
                    //     $scope.documents = data;
                    //     angular.forEach(data, function(documentItem) {
                    //         angular.forEach(documentItem.file, function(fileId) {
                    //             if (fileId !== null) {
                    //                 fileService.get({id: fileId}).$promise.then(function(data) {
                    //                     $scope.files.push(data);
                    //                     if (data.usersInterestedIn !== null) {
                    //                         angular.forEach(data.usersInterestedIn, function(userInterested) {
                    //                             $scope.userInterested = userInterested;
                    //                         });    
                    //                     }
                    //                 });
                    //             }
                    //         });
                    //     });
                    // }

                    // angular.forEach(data, function(documentItem) {
                    //     angular.forEach(documentItem.file, function(fileId) {
                    //         fileService.get({'id': fileId}).$promise.then(function(data) {
                    //             $scope.files.push(data);
                    //             angular.forEach(data.usersInterestedIn, function(userInterested){
                    //                 $scope.userInterested = userInterested;
                    //             });
                    //         });
                    //     });
                    // });
                
            $scope.filterFunction = function(element) {
                return element.title.match(/^Ma/) ? true : false;
            };
            $scope.interested = function(value) {
                fileService.interested({'id': value},{}).$promise.then(function(data) {
                });
            };
        }
    }
});