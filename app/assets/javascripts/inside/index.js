//= require jquery-2.X.min.js
//= require jquery.magnific-popup.min.js
//= require modules/perfect-scrollbar-0.4.1.with-mousewheel.min.js
//= require angular.min.js
//= require angular-sanitize.js
//= require modules/ng-infinite-scroll.js
//= require modules/sr-feeds.js
//= require modules/sr-filters.js


// App Init
// ========================================
var app = angular.module('SmallRead',
    [
        'ngSanitize',
        'small-read:feeds',
        'small-read:filters',
        'infinite-scroll'
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
    .when('/group/:groupId/feeds/:feedId', {
        templateUrl: 'reader_view.html',
        controller: 'ReaderCtrl'
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
    $rootScope.feeds = Feeds.getFeedCards(feedCardsStyle);
}]);


// Controllers
// ========================================
// App
app.controller('AppCtrl',
['$scope', '$location',
function($scope, $location) {
    $scope.navbar = {
        pined: false,
        cardFormat: true,
        preferPinned: false,
        styles: {
            autoHide:      'navbar-autohide-true',
            pin:           'icon-pushpin',
            displayFormat: 'icon-list'
        },
        target: {
            displayFormat: '#/feeds/all'
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
                $location.path('/group/all/feeds/all');
                $scope.feedsToolbar = {styles: 'hide'};
            } else { // switch to cards
                $location.path('/');
                $scope.feedsToolbar = {styles: null};
            }
        },
        changeToGroup: function(groupId) {
            var match = /.+?feeds\/(.+?)$/.exec($location.path());
            if (match) {
                $location.path('/group/'+groupId+'/feeds/all');
            } else {
                if (groupId === 'all') {
                    $location.path('/');
                } else {
                    $location.path('/group/'+groupId);
                }
            }
        }
    };
}]);


// Navbar
app.controller('NavbarCtrl',
['$scope',
function($scope) {

}]);


// FeedShowcase
app.controller('FeedShowcaseCtrl',
['$scope', 'Feeds', '$routeParams', '$rootScope',
function($scope, Feeds, $routeParams, $rootScope) {
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
    if ($routeParams.feedId === 'all') {
        $scope.tweets = [];
        $scope.activeFeedId = null;
    } else {
        $scope.tweets = Feeds.getTweets($routeParams.feedId);
        $scope.activeFeedId = $routeParams.feedId;
    }

    // event
    $($window).on('scroll', function(event) {
        $scope.$broadcast('listScrolling', $($window).scrollTop());
    });
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
            if (scope.feed.id == scope.activeFeedId) {
                element.addClass('active');
            } else {
                // element.removeClass();
            }
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
            });
        }
    }
});
