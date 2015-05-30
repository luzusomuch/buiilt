'use strict';
angular.module('buiiltApp').directive('file', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/file/file.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $cookieStore, userService, $location, documentService, packageService, fileService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
            $scope.files = [];
            $scope.file = {};
            $scope.currentUser = {};
            if ($cookieStore.get('token')) {
                $scope.currentUser = userService.get();
            }

            packageService.getPackageByProject({'id':$scope.project}).$promise.then(function(data) {
                angular.forEach(data, function(packageItem, key){
                    $scope.packageItem = packageItem;
                    documentService.getByProjectAndPackage({'id':$scope.packageItem._id}).$promise.then(function(data) {
                        $scope.documents = data;
                        angular.forEach(data, function(documentItem, key) {
                            fileService.get({'id': documentItem.file}).$promise.then(function(data) {
                                $scope.files.push(data);
                            });
                        });
                    });
                });
                }, function(res) {
                    $scope.errors = res.data;
                });
            $scope.filterFunction = function(element) {
                return element.title.match(/^Ma/) ? true : false;
            };
            $scope.interested = function(value) {
                fileService.interested({'id': value},{}).$promise.then(function(data) {
                    console.log(data);
                });
            };
        }
    }
});