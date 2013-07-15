//= require jquery-2.X.min.js
//= require jquery.magnific-popup.min.js
//= require modules/perfect-scrollbar-0.4.1.with-mousewheel.min.js
//= require angular.min.js
//= require angular-sanitize.js
//= require modules/sr-feeds.js
//= require modules/sr-filters.js


// App Init
// ========================================
var app = angular.module('SmallRead',
    [
        'ngSanitize',
        'small-read:feeds',
        'small-read:filters'
    ]
);


// Value
// ----------------------------------------
app.value('feedCardsStyle', function(data) {
    for (var i = 0; i < data.length; i++) {
        // cover image
        if (data[i].coverTweet.withImage) {
            data[i].coverBg = {
                backgroundImage: "url(\""+data[i].coverTweet.entities.media[0].media_url+":small\")"
            };
        }
        // styles
        data[i].styles = (data[i].coverTweet.entities.media) ? "with-image" : "without-image";
        data[i].styles += " with-top-tweets-"+data[i].topTweets.length;
        if (data[i].coverTweet.lang === 'zh' && data[i].coverTweet.text.length > 100) data[i].styles += " very-long-zh-text"; // fix chinese long text overflow
    }
    return data;
});


// Config
// ----------------------------------------
app.config(
['$routeProvider',
function($routeProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'cards_view.html',
        controller: 'FeedShowcaseCtrl'
    })
    .when('/group/:groupId', {
        templateUrl: 'cards_view.html',
        controller: 'FeedShowcaseCtrl'
    })
    .when('/group/:groupId/feeds', {
        templateUrl: 'reader_view.html',
        controller: 'ReaderCtrl',
        reloadOnSearch: false
    })
    .otherwise({
        redirectTo: '/'
    });
}]);


// Run
// ----------------------------------------
app.run(
['$rootScope', 'Feeds', 'feedCardsStyle',
function($rootScope, Feeds, feedCardsStyle) {
    Feeds.getFeedCards(feedCardsStyle)
    .then(function(data) {
        $rootScope.feeds = data;
    });
}]);


// Controllers
// ========================================
// App
app.controller('AppCtrl',
['$scope', '$location', '$http', '$rootScope',
function($scope, $location, $http, $rootScope) {
    $scope.navbar = {
        pined: false,
        cardFormat: true,
        preferPinned: false,
        styles: {
            autoHide:      'navbar-autohide-true',
            pin:           'icon-pushpin',
            displayFormat: 'icon-list'
        },
        displayFormatButtonText: 'Reader Style',
        pinNavbar: function() {
            this.styles.autoHide = 'navbar-autohide-false';
            this.styles.pin      = 'icon-remove';
            this.pined           = true;
        },
        unpinNavbar: function() {
            this.styles.autoHide = 'navbar-autohide-true';
            this.styles.pin      = 'icon-pushpin';
            this.pined           = false;
        },
        switchNavbar: function() {
            if (this.pined) {
                this.unpinNavbar();
                this.preferPinned = false;
            } else {
                this.pinNavbar();
                this.preferPinned = true;
            }
        },
        changeToReaderFormat: function() {
            this.pinNavbar();
            this.styles.pin = 'hide';
            this.styles.displayFormat = 'icon-th';
            this.displayFormatButtonText = 'Card Style';
            this.cardFormat = false;
        },
        changeToCardsFormat: function() {
            this.preferPinned ? this.pinNavbar() : this.unpinNavbar();
            this.styles.displayFormat = 'icon-list';
            this.displayFormatButtonText = 'Reader Style';
            this.cardFormat = true;
        },
        changeDisplayFormat: function() {
            if (this.cardFormat) { // switch to reader
                $location.path('/group/all/feeds');
                $scope.feedsToolbar = {styles: 'hide'};
            } else { // switch to cards
                $location.path('/');
                $location.search('feed_id', null);
                $scope.feedsToolbar = {styles: null};
            }
        },
        changeToGroup: function(groupId) {
            if ($location.search.feed_id || /.+\/feeds.*/.exec($location.path())) {
                $location.path('/group/'+groupId+'/feeds');
                $location.search('feed_id', null);
            } else {
                if (groupId === 'all') {
                    $location.path('/');
                } else {
                    $location.path('/group/'+groupId);
                }
            }
        }
    };
    // functions
    $scope.markAllRead = function(feedId) {
        $http.post('/mark_all_read?feed_id='+feedId)
        .success(function() {
            var targetPosition = 0;
            for (var i = 0; i < $rootScope.feeds.length; i++) {
                if ($rootScope.feeds[i].id == feedId) {
                    targetPosition = i;
                    break;
                }
            };
            $rootScope.feeds.splice(targetPosition, 1);
        });
    };
}]);


// Navbar
app.controller('NavbarCtrl',
['$scope', '$http',
function($scope, $http) {

}]);


// FeedShowcase
app.controller('FeedShowcaseCtrl',
['$scope', 'Feeds', '$routeParams', '$rootScope', '$http',
function($scope, Feeds, $routeParams, $rootScope, $http) {
    // init
    $scope.navbar.changeToCardsFormat();
    $rootScope.$broadcast('activeGroup', $routeParams.groupId);
    $scope.groupId = $routeParams.groupId ? $routeParams.groupId : '';
}]);


// ReaderCtrl
app.controller('ReaderCtrl',
['$rootScope', '$scope', '$http', '$routeParams', '$window', 'Feeds',
function($rootScope, $scope, $http, $routeParams, $window, Feeds) {
    // init task
    $scope.navbar.changeToReaderFormat();
    $rootScope.$broadcast('activeGroup', $routeParams.groupId);
    if ($routeParams.groupId === 'all') {
        $scope.groupId = '';
    } else {
        $scope.groupId = $routeParams.groupId;
    }
    // load tweets
    $scope.tweets = [];
    $scope.tweetsLoading = false;
    $scope.loadMoreTweets = function(reload) {
        if ($scope.reachesEnd || $scope.tweetsLoading) return;
        $scope.tweetsLoading = true;
        if (reload === true) {
            var maxId = null;
        } else {
            var maxId = $scope.tweets.length === 0 ? null : $scope.tweets[$scope.tweets.length - 1].id - 1;
        }
        Feeds.getTweets($scope.activeFeedId, maxId)
        .then(function(data) {
            if (data.length < 20) $scope.reachesEnd = true;
            $scope.tweets = reload ? data : $scope.tweets.concat(data);
            $scope.tweetsLoading = false;
        });
    }
    // events $routeChangeSuccess
    var routeChangeCallback = function(event, route) {
        $scope.reachesEnd = false;
        if (typeof route.params.feed_id === 'undefined' || route.params.feed_id === 'all') {
            $scope.activeFeedId = null;
        } else {
            $scope.activeFeedId = route.params.feed_id;
            $scope.loadMoreTweets(true);
        }
    }
    $scope.$on('$routeChangeSuccess', routeChangeCallback);
    $scope.$on('$routeUpdate', routeChangeCallback);
}]);


// Directive
// ========================================
// Folder
app.directive('folder',
function() {
    return {
        link: function(scope, element, attrs) {
            scope.$on('activeGroup', function(event, groupId) {
                if (groupId === attrs.folder) {
                    element.addClass('active');
                } else if (typeof groupId === 'undefined' && attrs.folder === 'all') {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            });
        }
    };
});


// feed
app.directive('feed', function() {
    return {
        link: function(scope, element, attrs) {
            var changeActiveState = function(event, route) {
                var targetFeedId = typeof route !== 'undefined' ? route.params.feed_id : scope.activeFeedId;
                if (scope.feed.id == targetFeedId) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            }
            changeActiveState();
            scope.$on('$routeUpdate', changeActiveState);
        }
    };
});


// Tweet
app.directive('tweet', function() {
    return {
        controller: ['$scope', '$element', '$http', function($scope, $element, $http) {
            $scope.markingRead = false;
            $scope.markRead = function() {
                $scope.markingRead = true;
                $element.addClass('read');
                $scope.tweet.read = true;
                $http.get('/tweets/'+$scope.tweet.id+'/mark_read')
                .success(function() {
                    $scope.markingRead = false;
                });
            };
        }],
        link: function(scope, element, attrs) {
            scope.$on('tweetsListScrolled', function(event) {
                if (!scope.tweet.read && !scope.markingRead && element.position().top < -25) scope.markRead();
            });
        }
    };
});


// magnificPopup
app.directive('magnificPopup', function() {
    return {
        template: '<img ng-src="{{ media.media_url }}:thumb" />',
        link: function(scope, element, attrs) {
            $(element[0]).magnificPopup({type:'image'});
        }
    };
});

// perfect-scrollbar
app.directive('perfectScrollbar', function() {
    return {
        link: function(scope, element) {
            element.perfectScrollbar({
                wheelSpeed: 25
            });
        }
    }
});

// tweets-list
app.directive('tweetsList', function() {
    return {
        link: function(scope, element) {
            element.on('scroll', function(event) {
                scope.$broadcast('tweetsListScrolled');
                var distanceToTop = element.children('.tweets-list-item').last().position().top;
                if (distanceToTop - 100 < element.height()) scope.loadMoreTweets();
            });
            scope.$on('$routeUpdate', function(event, route) {
                element.scrollTop(0);
                element.perfectScrollbar('update');
            });
        }
    }
});
