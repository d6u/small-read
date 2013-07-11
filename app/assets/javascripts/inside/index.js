//= require jquery-2.X.min.js
//= require jquery.magnific-popup.min.js
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
    .when('/feeds/:id', {
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
    $rootScope.feedCards = Feeds.getFeedCards(feedCardsStyle);
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
                $location.path('/feeds/all');
            } else { // switch to cards
                $location.path('/');
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
}]);


// ReaderCtrl
app.controller('ReaderCtrl',
['$rootScope', '$scope', '$http', '$routeParams', '$window', 'Feeds',
function($rootScope, $scope, $http, $routeParams, $window, Feeds) {
    // init task
    $scope.navbar.changeToReaderFormat();
    if ($routeParams.id === 'all') $scope.feedsToolbar = {styles: 'hide'};
    $scope.feeds = Feeds.getFeeds();
    // load tweets
    if ($routeParams.id === 'all') {
        $scope.tweets = [];
    } else {
        $scope.tweets = Feeds.getTweets($routeParams.id);
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


// Tweet
app.directive('tweet', function() {
    return {
        controller: ['$scope', '$element', '$http', function($scope, $element, $http) {
            $scope.markingRead = false;
            $scope.markRead = function() {
                if ($scope.tweet.read || $scope.markingRead) return;
                $scope.markingRead = true;
                $scope.tweet.read = true;
                $element.addClass('read');
                // TODO: wait for angular.js fix
                //       use get function to avoid angular.js rapid put error
                $http.get('/tweets/'+$scope.tweet.id+'/mark_read')
                .success(function() {
                    $scope.markingRead = false;
                });
            };
        }],
        link: function(scope, element, attrs) {
            scope.$on('listScrolling', function(event, windowScrollTop) {
                if (element.position().top - windowScrollTop - 56 < -30) {
                    scope.markRead();
                }
            });
        }
    };
});


app.directive('magnificPopup', function() {
    return {
        template: '<img ng-src="{{ media.media_url }}:thumb" />',
        link: function(scope, element, attrs) {
            $(element[0]).magnificPopup({type:'image'});
        }
    };
});
