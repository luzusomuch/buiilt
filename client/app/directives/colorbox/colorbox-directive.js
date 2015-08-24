'use strict';
angular.module('buiiltApp').directive('colorbox', function($compile, $rootScope){
    return {
        link: function(scope, element, attrs){
            element.click('bind', function(){
                scope.maximunHeight = $rootScope.maximunHeight - 30;
                $.colorbox({
                    href: attrs.colorbox,
                    onComplete: function(){
                        $rootScope.$apply(function(){
                            var content = $('#cboxLoadedContent');
                            $("div#cboxLoadedContent").css('height',scope.maximunHeight+'px');
                            $compile(content)($rootScope);      
                        });
                    }
                });
            });
        }
    };
});