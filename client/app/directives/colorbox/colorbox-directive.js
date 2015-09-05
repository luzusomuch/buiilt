'use strict';
angular.module('buiiltApp').directive('colorbox', function($compile, $rootScope){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            element.click('bind', function(e){
                e.preventDefault();
                var gallery = $(element).children().children();
                var elementClass = "a."+$(gallery[0]).attr('class');
                // scope.maximunHeight = $rootScope.maximunHeight - 30;
                $(elementClass).colorbox({
                    href: attrs.href,
                    rel: function(){return $(this).data('rel');},
                    open: true
                    // rel: attrs.rel,
                    // onComplete: function(){
                    //     $rootScope.$apply(function(){
                    //         var content = $('#cboxLoadedContent');
                    //         $("div#cboxOverlay").css('background','#ccc');
                    //         $("div#cboxLoadedContent").css('height',scope.maximunHeight+'px');
                    //         $("img.cboxPhoto").css({'height':'100%','width':'auto'});
                    //         $compile(content)($rootScope);      
                    //     });
                    // }
                });
            });
            // scope.maximunHeight = $rootScope.maximunHeight - 30;

            // $(element).colorbox(attrs.colorbox);
        }
    };
});