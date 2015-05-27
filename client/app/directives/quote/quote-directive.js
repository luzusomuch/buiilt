'use strict';
angular.module('buiiltApp').directive('quote', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/quote/quote.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, quoteService, userService, projectService) {
            $scope.errors = {};
            $scope.user = {};
            $scope.value = "";
            // console.log($scope.project);
            quoteService.getByProjectId({'id':$scope.project}).$promise.then(function(data) {
                $scope.quoteRequests = data;
                _.each(data, function(quote) {
                    userService.get({'id': quote.user}, function(user) {
                        if (user) {
                          $scope.user = user;
                        }
                    });
                });
                }, function(res) {
                    $scope.errors = res.data;
                });
            $scope.selectWinner = function(value){
                quoteService.get({'id': value}).$promise.then(function(quote) {
                    projectService.selectWinner({'id': quote.project},{'quote': quote.price,'homeBuilder': quote.user}).$promise.then(function(data) {
                        console.log(data);
                    }, function(res) {
                        $scope.errors = res.data;
                    });
                });
            };
        }
    }
});