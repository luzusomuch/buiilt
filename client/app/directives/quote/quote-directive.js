'use strict';
angular.module('buiiltApp').directive('quote', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/quote/quote.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $location, quoteService, userService, projectService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
            $scope.value = "";
            quoteService.getByProjectId({'id':$scope.project}).$promise.then(function(data) {
                $scope.quoteRequests = data;
                }, function(res) {
                    $scope.errors = res.data;
                });
            $scope.selectWinner = function(value){
                quoteService.get({'id': value}).$promise.then(function(quote) {
                    projectService.selectWinner({'id': quote.project},{'quote': quote.price,'homeBuilder': quote.user, 'email': quote.email}).$promise.then(function(data) {
                        $scope.success = data;
                        $location.go('/quote');
                    }, function(res) {
                        $scope.errors = res.data;
                    });
                });
            };
            projectService.get({'id': $scope.project}).$promise.then(function(data) {
                $scope.project = data;
            });
        }
    }
});