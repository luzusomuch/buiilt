'use strict';
angular.module('buiiltApp')
  .directive('slimscroll', function () {
    return {
      restrict: 'A',
      link: function ($scope, $elem, $attr) {
        var off = [],
          option = {};

        if ($attr.slimscrollOption) {
          option = angular.copy($scope.$eval($attr.slimscrollOption));
        }

        //run slimscroll
        var slim = $($elem).slimScroll(option);

        if ($attr.scrollToBottomCb) {
          slim.bind('slimscroll', function (e, pos) {
            if (pos === 'bottom') {
              $scope.$eval($attr.scrollToBottomCb)();
            }
          });
        }

        $scope.$on('$destroy', function () {
          off.forEach(function (unbind) {
            unbind();
          });
          off = null;
        });
      }
    };
  })
  .directive('spMessagesScroller', function () {
    return {
      restrict: 'A',
      link: function ($scope, $elem, $attr) {
        var off = [],
          option = {},
          top = false,
          curScrollHeight = 0;

        if ($attr.slimscrollOption) {
          option = angular.copy($scope.$eval($attr.slimscrollOption));
        }

        //run slimscroll
        $($elem).slimScroll(option).bind('slimscroll', function (e, pos) {
          if (pos === 'top') {
            $scope.$eval($attr.slimscrollLoadPreMessages)();
            top = true;
            curScrollHeight = $elem[0].scrollHeight;
          } else {
            top = false;
          }
        });

        //callback function load message when scroll top
        var scrollTimeOut = '';
        /** scroll chat for chat box. set attr slimscrollChat=true */
        off.push($scope.$watchCollection($attr.slimscrollWatch, function () {
          clearTimeout(scrollTimeOut);
          scrollTimeOut = setTimeout(function () {
            if (top) {
              if ($elem[0].scrollHeight > curScrollHeight) {
                $($elem).slimScroll({scrollTo: ($elem[0].scrollHeight - curScrollHeight) + 'px'});
              }
            } else {
              $($elem).slimScroll({scrollTo: 'bottom'});
            }
          }, 300);
        }));

        $scope.$on('$destroy', function () {
          off.forEach(function (unbind) {
            unbind();
          });
          off = null;
        });
      }
    };
  });
