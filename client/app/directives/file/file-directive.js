'use strict';
angular.module('buiiltApp').directive('file', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/file/file.html',
        scope:{
            project:'='
        },
        controller: function($scope, $rootScope, $location, projectService, packageService) {
            $scope.errors = {};
            $scope.success = {};
            $scope.user = {};
            // packageService.getPackageByProject({'id':$scope.project}).$promise.then(function(data) {
            //     $scope.packages = data;
            //     console.log($scope.packages);
            //     }, function(res) {
            //         $scope.errors = res.data;
            //     });
            
        }
    }
});