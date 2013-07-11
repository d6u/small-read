//= require jquery-2.X.min.js
//= require jquery.magnific-popup.min.js
//= require angular.min.js
//= require angular-sanitize.js
//= require modules/ng-infinite-scroll.js
//= require modules/sr-feeds.js
//= require modules/sr-filters.js


// App Init
// ========================================
var app = angular.module('SmallRead', ['ngSanitize', 'infinite-scroll', 'small-read:feeds', 'small-read:filters']);


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


app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
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


app.run(['$rootScope', 'Feeds', 'feedCardsStyle', function($rootScope, Feeds, feedCardsStyle) {
    Feeds.getFeedCards().then(function(response) {
        $rootScope.feedCards = feedCardsStyle(response.data);
    });
}]);


// Controllers
// ========================================
app.controller('AppCtrl',
    ['$scope', '$location', function($scope, $location) {
        $scope.navbar = {
            pined: false,
            cardFormat: true,
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
                } else {
                    this.pinNavbar();
                }
            },
            changeDisplayFormat: function() {
                if (this.cardFormat) { // switch to reader
                    this.styles.displayFormat = 'icon-th';
                    this.displayFormatButtonText = 'Card Style';
                    this.cardFormat = false;
                    // Disable auto hide navbar
                    this.pinNavbar();
                    this.styles.pin = 'hide';
                    $location.path('/feeds/all');
                } else { // switch to cards
                    this.styles.displayFormat = 'icon-list';
                    this.displayFormatButtonText = 'Reader Style';
                    this.cardFormat = true;
                    // Enable auto hide navbar
                    this.unpinNavbar();
                    $location.path('/');
                }
            }
        };
    }]
);


app.controller('FeedShowcaseCtrl',
    ['$scope', 'Feeds', function($scope, Feeds) {

    }]
);


app.controller('ReaderCtrl',
    ['$scope', '$http', '$routeParams', '$window', 'Feeds', function($scope, $http, $routeParams, $window, Feeds) {







        // load more tweets
        $scope.loadMoreTweets = function() {
            if ($scope.reacheEnd || $scope.busyScrolling || $scope.tweets.length === 0) return;
            $scope.busyScrolling = true;
            var url = $scope.loadOnlyUnread ? $scope.baseUrl+"?max_id="+$scope.maxTweetId : $scope.baseUrl+"&max_id="+$scope.maxTweetId;
            $http.get(url).success(function(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                }
                $scope.tweets = $scope.tweets.concat(data);
                if (data.length > 0) $scope.maxTweetId = data[data.length - 1].id - 1;
                $scope.reacheEnd = data.length < 20 ? true : false;
                $scope.busyScrolling = false;
            });
        };

        // init task
        $scope.tweets = [];
        $scope.busyScrolling = false;
        $scope.reacheEnd = false;
        $scope.loadOnlyUnread = true;
        Feeds.getFeeds().then(function(response) {
            $scope.feeds = response.data;
        });
        var tweetsId = $routeParams.id === 'all' ? null : $routeParams.id;
        Feeds.getTweets(tweetsId).then(function(response) {
            $scope.tweets = response.data;
            $scope.reacheEnd = response.data.length < 20 ? true : false;
            if (response.data.length > 0) $scope.maxTweetId = response.data[response.data.length - 1].id - 1;
        });

        // event
        $($window).on('scroll', function(event) {
            $scope.$broadcast('listScrolling', $($window).scrollTop());
        });
    }]
);


// Directive
// ========================================
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
