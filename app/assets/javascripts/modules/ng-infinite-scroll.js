/* ng-infinite-scroll - v1.0.0 - 2013-02-23 */

var mod = angular.module('infinite-scroll', []);

mod.directive('infiniteScroll', [
    '$rootScope', '$window', '$timeout',
    function ($rootScope, $window, $timeout) {
        return {
            link: function (scope, elem, attrs) {
                var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
                scrollDistance = 0;
                if (attrs.infiniteScrollDistance != null) {
                    scope.$watch(attrs.infiniteScrollDistance, function (value) {
                        return scrollDistance = parseInt(value, 10);
                    });
                }
                scrollEnabled = true;
                checkWhenEnabled = false;
                if (attrs.infiniteScrollDisabled != null) {
                    scope.$watch(attrs.infiniteScrollDisabled, function (value) {
                        scrollEnabled = !value;
                        if (scrollEnabled && checkWhenEnabled) {
                            checkWhenEnabled = false;
                            return handler();
                        }
                    });
                }
                handler = function () {
                    // var elementBottom, remaining, shouldScroll, windowBottom;
                    // windowBottom = elem.height() + elem.scrollTop();
                    // elementBottom = elem.offset().top + elem.height();
                    // remaining = elementBottom - windowBottom;
                    var remaining, shouldScroll;
                    remaining = elem.children().height() - elem.height() - elem.scrollTop();
                    shouldScroll = remaining <= elem.height() * scrollDistance;
                    if (shouldScroll && scrollEnabled) {
                        if ($rootScope.$$phase) {
                            return scope.$eval(attrs.infiniteScroll);
                        } else {
                            return scope.$apply(attrs.infiniteScroll);
                        }
                    } else if (shouldScroll) {
                        return checkWhenEnabled = true;
                    }
                };
                elem.on('scroll', handler);
                scope.$on('$destroy', function () {
                    return $window.off('scroll', handler);
                });
                return $timeout((function () {
                    if (attrs.infiniteScrollImmediateCheck) {
                        if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
                            return handler();
                        }
                    } else {
                        return handler();
                    }
                }), 0);
            }
        };
    }
]);