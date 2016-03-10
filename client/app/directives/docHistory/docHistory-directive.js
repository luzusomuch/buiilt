'use strict';
angular.module('buiiltApp').directive('docHistory', function(){
    return {
        restrict: 'EA',
        templateUrl: 'app/directives/docHistory/docHistory.html',
        scope:{
            data:'='
        },
        controller: function($scope, $rootScope, $state, $mdDialog) {
			$scope.$state = $state;

            $scope.showDocumentHistoryDetail = function($event, history) {
                $mdDialog.show({
                    targetEvent: $event,
                    controller: ["$scope", function($scope) {
                        $scope.history =  history;
                        
                        $scope.closeModal = function() {
                            $mdDialog.hide();
                        };

                        $scope.download = function(name, link) {
                            filepicker.exportFile(
                                {url: link, filename: name},
                                function(Blob){
                                    console.log(Blob.url);
                                }
                            );
                        };
                    }],
                    templateUrl: 'app/directives/docHistory/document-history-detail.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                });
            };
        }
    };
});