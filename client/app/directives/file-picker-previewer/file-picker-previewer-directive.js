'use strict';

angular.module('buiiltApp')
.directive('filePickerPreviewer', filePickerPreviewerDirective)
.directive('filePickerThumbnail', filePickerThumbnailDirective);

function filePickerPreviewerDirective($rootScope, filepickerService){
    return {
        restrict: 'A',
        scope:{
            url: '@',
        },
        link: function(scope, element, attrs) {
            var url = scope.url;

            var iframe = document.createElement('iframe');
            iframe.src = url;

            /* Set full size so it gets size from parrent element  */

            iframe.width = '100%';
            iframe.height = '100%';
            angular.element(element).append(iframe);
            
            scope.$watch('url', setUrl);

            function setUrl(url){
                if (!url) {    
                    return;
                } else {
                    url = url.replace('api/file/', 'api/preview/');
                }
                iframe.src = url;
            }
        }
    };
};

function filePickerThumbnailDirective($rootScope, filepickerService) {
    return {
        restrict: "A",
        scope: {
            url: "@"
        },
        link: function(scope, element, attrs) {
            var splitedUrl = scope.url.split("/");
            var result = "https://process.filestackapi.com/AM6Wn3DzwRimryydBnsj7z/output=format:jpg/"
            result += splitedUrl[splitedUrl.length-1];
            attrs.$set("src", result);
        }
    }
};