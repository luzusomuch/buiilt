'use strict';
angular.module('buiiltApp').directive('addendum', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/addendum/addendum.html',
        scope: {
            package: '=',
            type: '@'
        },
        controller: function($scope,$timeout,addOnPackageService,$rootScope) {
            $scope.addendum = {};
            $scope.editAddendum = {};
            $scope.addendumScope = {};
            $scope.addendumsScope = [];

            $scope.addAddendum = function() {
                if ($scope.package.type == 'material') {
                    if ($scope.addendum.scopeDescription && $scope.addendum.quantity) {
                        $scope.addendumsScope.push({scopeDescription: $scope.addendum.scopeDescription, quantity: $scope.addendum.quantity});
                        $scope.addendum.scopeDescription = null;
                        $scope.addendum.quantity = null;
                    }
                }
                else if ($scope.package.type == 'variation' || $scope.package.type == 'contractor' || $scope.package.packageType == 'BuilderPackage' || $scope.package.packageType == 'contractor') {
                    if ($scope.addendum.scopeDescription) {
                        $scope.addendumsScope.push({scopeDescription: $scope.addendum.scopeDescription});
                        $scope.addendum.scopeDescription = null;
                        $scope.addendum.quantity = null;
                    }
                }
                
            };
            $scope.removeAddendum = function(index) {
                $scope.addendumsScope.splice(index, 1);
            };

            $scope.sendAddendum = function() {
                if ($scope.addendumsScope) {
                    addOnPackageService.sendAddendum({id: $scope.package._id, 
                        packageType: $scope.type, description: $scope.addendum, 
                        addendumScope: $scope.addendumsScope})
                    .$promise.then(function(data) {
                        $scope.addendums = data;
                        $scope.package = data;
                        $scope.addendum = {};
                        $scope.addendumsScope = [];
                        $rootScope.$emit('addendum', data);
                    });    
                }
            };

            $scope.remove = function(value){
                addOnPackageService.removeAddendum({id: $scope.package._id, packageType: $scope.type, addendumId: value})
                .$promise.then(function(data){
                    $scope.addendums = data;
                    $scope.package = data;
                });
            };

            $scope.error = false;
            $scope.edit = function(addendumId) {
                addOnPackageService.editAddendum({id: $scope.package._id, packageType: $scope.type, addendumId: addendumId, addendum: $scope.editAddendum})
                .$promise.then(function(data){
                    $scope.addendums = data;
                    $scope.package = data;
                    $rootScope.$emit('addendum', data);
                }, function(res){
                    $scope.error = true;
                    $timeout(function() {
                        $scope.error = false;
                    }, 5000);
                });

            };

            $scope.getAddendumScopeUpdate = function(value){
                $scope.addendumScopeId = value;
            }
        }
    }
});