//= require settings/settings_common
//= require jquery-ui-1.10.3.custom.min.js
//= require angular.min.js
//= require modules/sr-feeds.js


// Setup
// ----------------------------------------
var app = angular.module('SmallRead', ['small-read:feeds']);


// Controller
// ----------------------------------------
app.controller('AppCtrl',
['$scope', '$http', 'Feeds',
function($scope, $http, Feeds) {

}]);


app.controller('FeedsSortingCtrl',
['$scope', 'Feeds', '$element',
function($scope, Feeds, $element) {
    // methods
    $scope.updateFolderTree = function() {
        $('.manage-feeds-container').each(function(index) {
            var folder = $(this).scope().folder;
            var feeds = $.map(
                $(this).children('.manage-feeds-feed'),
                function(ele, index) {
                    var feed = $(ele).scope().feed;
                    feed.selected = false;
                    if (feed.folder_id !== folder.id) {
                        feed.folder_id = folder.id;
                        Feeds.updateFeeds([feed]);
                    }
                    return feed;
                }
            );
            folder.feeds = feeds;
        });
    };
    // init
    Feeds.getGroupsAndFeeds().then(function(data) {
        $scope.folders = data;
    });
    // events
    $scope.$on('sortingStart', function(event) {
        $element.find('.manage-feeds-feed.true').css({display: 'none'});
    });
    $scope.$on('sortingEnd', function(event, targetElement) {
        var feedElements = $element.find('.manage-feeds-feed.true').css({display: ''});
        targetElement.prepend(feedElements);
        $scope.$apply(function() {
            $scope.updateFolderTree();
        });
    });
}]);


// Directive
// ----------------------------------------
app.directive('jqSortable',
['Feeds',
function(Feeds) {
    return function(scope, element, attrs) {
        var options = {
            cursor: 'move',
            distance: 5,
            helper: function(event, item) {
                return $(item).clone().removeClass('true');
            },
            start: function(event, ui) {
                if (ui.item.hasClass('false')) {
                    scope.$apply(function(scope) {
                        for (var i = 0; i < scope.folders.length; i++) {
                            for (var j = 0; j < scope.folders[i].feeds.length; j++) {
                                scope.folders[i].feeds[j].selected = false;
                            };
                        };
                    });
                } else {
                    scope.$emit('sortingStart');
                }
            },
            stop: function(event, ui) {
                scope.$emit('sortingEnd', ui.item.parents('.manage-feeds-container'));
            }
        };
        if (attrs.jqSortableConnectWith) options['connectWith'] = attrs.jqSortableConnectWith;
        element.sortable(options);
    };
}]);
