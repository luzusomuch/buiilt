'use strict';
angular.module('buiiltApp').directive('colorbox', function($compile, $rootScope){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            element.click('bind', function(e){
                e.preventDefault();
                var gallery = $(element).children().children();
                var elementClass = "a."+$(gallery[0]).attr('class');
                scope.maximunHeight = $rootScope.maximunHeight - 30;
                var screenWidth = $(window).width();
                console.log(scope.maximunHeight);
                $(elementClass).colorbox({
                    href: attrs.href,
                    rel: function(){return $(this).data('rel');},
                    open: true,
                    // rel: attrs.rel,
                    onComplete: function(){
                        $rootScope.$apply(function(){
                            var type = $(elementClass).data('type');
                            var content = $('#cboxLoadedContent');
                            $("div#cboxOverlay").css('background','#ccc');
                            $("div#cboxContent").css({'height':scope.maximunHeight+'px','width':'auto'});
                            $("div#cboxLoadedContent").css({'height':scope.maximunHeight+'px','width':'auto'});
                            if (type == 'jgp') {
                                $("img.cboxPhoto").css({'height':'auto','width':'100%'});
                            }
                            else if (type == 'pdf') {
                                $("img.cboxPhoto").css({'height':'auto','width':screenWidth+'px'});   
                            }
                            $compile(content)($rootScope);      
                        });
                    }
                });
            });
            // scope.maximunHeight = $rootScope.maximunHeight - 30;

            // $(element).colorbox(attrs.colorbox);
        }
    };
});