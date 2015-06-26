'use strict';
angular.module('buiiltApp').directive('addendum', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/addendum/addendum.html',
        scope: {
            package: '=',
            type: '@'
        },
        controller: function($scope,addOnPackageService) {
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
                    packageType: $scope.type, description: $scope.addendum, 
                    addendumScope: $scope.addendumsScope})
                .$promise.then(function(data) {
                    $scope.addendums = data;
                    $scope.package = data;
                    $scope.addendum = {};
                    alert('Send Addendum successfully!');
                });
            };
        }
    }
});