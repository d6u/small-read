//= require modules/time-parser.js
//= require jquery-2.X.min.js
//= require jquery.magnific-popup.min.js
//= require angular.min.js
//= require angular-sanitize.js
//= require modules/ng-infinite-scroll.js


// App Init
// ========================================
var app = angular.module('SmallRead', ['ngSanitize', 'infinite-scroll']);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'feeds_show_case_template.html',
        controller: 'FeedShowcaseCtrl'
    })
    .when('/feed/:id', {
        templateUrl: 'feeds_more_tweets_template.html',
        controller: 'TweetsCtrl'
    })
    .otherwise({
        redirectTo: '/'
    });
}]);


// Controllers
// ========================================
app.controller('AppCtrl',
    ['$scope', function($scope) {

    }]
);


app.controller('FeedShowcaseCtrl',
    ['$scope', '$http', function($scope, $http) {
        $http.get('/feeds_with_top_tweets')
        .then(function(response) {
            for (var i = 0; i < response.data.length; i++) {
                // parase entities from JSON to object
                response.data[i].coverTweet.entities = angular.fromJson(response.data[i].coverTweet.entities);
                response.data[i].coverTweet.createdAt = parseTime(response.data[i].coverTweet.createdAt);
                for (var j = 0; j < response.data[i].topTweets.length; j++) {
                    response.data[i].topTweets[j].entities = angular.fromJson(response.data[i].topTweets[j].entities);
                    response.data[i].topTweets[j].createdAt = parseTime(response.data[i].topTweets[j].createdAt);
                };
                // inject coverBg for background image
                if (response.data[i].coverTweet.withImage) {
                    response.data[i].coverBg = {
                        backgroundImage: "url(\""+response.data[i].coverTweet.entities.media[0].media_url+":small\")"
                    };
                    response.data[i].coverTextClass = "has-cover-image";
                } else {
                    response.data[i].coverTextClass = (response.data[i].coverTweet.text.length < 100) ? "no-cover-image" : "no-cover-image very-long-text";
                }
            };
            $scope.feeds = response.data;
        });
    }]
);


app.controller('TweetsCtrl',
    ['$scope', '$http', '$routeParams', '$window', function($scope, $http, $routeParams, $window) {
        // load more tweets
        $scope.loadMoreTweets = function() {
            if ($scope.reacheEnd || $scope.busyScrolling || $scope.tweets.length === 0) return;
            $scope.busyScrolling = true;
            var url = $scope.loadOnlyUnread ? $scope.baseUrl+"?max_id="+$scope.maxTweetId : $scope.baseUrl+"&max_id="+$scope.maxTweetId;
            $http.get(url).success(function(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                    data[i].created_at = parseTime(data[i].created_at);
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
        $scope.baseUrl = '/feeds/'+$routeParams.id+'/tweets';
        $http.get($scope.baseUrl)
        .then(function(response) {
            for (var i = 0; i < response.data.length; i++) {
                response.data[i].entities = angular.fromJson(response.data[i].entities);
                response.data[i].created_at = parseTime(response.data[i].created_at);
            };
            $scope.reacheEnd = response.data.length < 20 ? true : false;
            if (response.data.length > 0) $scope.maxTweetId = response.data[response.data.length - 1].id - 1;
            $scope.tweets = response.data;
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
                if (windowScrollTop - element.position().top > 40) {
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


// Filters
// ========================================
app.filter(
    'tweetTextFilter',
    function() {
        return function(input, entities) {
            // extract and sort entities
            var entity_array = [];
            for(var entity in entities) {
                angular.forEach(entities[entity], function(value, key){
                    value.type = entity;
                    entity_array.push(value);
                });
            }
            entity_array.sort(function(a,b){
                return a.indices[0] - b.indices[0];
            });
            // extract input pieces
            var input_pieces = [];
            var beginning_point = 0;
            angular.forEach(entity_array, function(value, key) {
                input_pieces.push(input.slice(beginning_point, value.indices[0]));
                switch (value.type) {
                    case "urls":
                        input_pieces.push('<a href="'+value.expanded_url+'" target="_blank">'+value.display_url+'</a>');
                        break;
                    case "hashtags":
                        input_pieces.push('<a href="https://twitter.com/search?q=%23'+value.text+'&src=hash" target="_blank>#'+value.text+'</a>');
                        break;
                    case "user_mentions":
                        input_pieces.push('<a href="http://twitter.com/'+value.screen_name+'" target="_blank>@'+value.screen_name+'</a>');
                        break;
                    case "media":
                        input_pieces.push('<a href="'+value.media_url+'" target="_blank>'+value.display_url+'</a>');
                        break;
                }
                beginning_point = value.indices[1];
            });
            // last piece, '140' fix truncated tweet text issue
            input_pieces.push(input.slice(beginning_point, 140));
            // return input
            return input_pieces.join("");
        };
    }
);

app.filter(
    'tweetTimestampFilter',
    function() {
        return function(input) {
            var currentDate = new Date();
            var diffInTime = currentDate - input;
            if (diffInTime / 1000 / 60 <= 60) {
                return Math.floor(diffInTime / 1000 / 60) + " mins ago";
            } else if (diffInTime / 1000 / 60 / 60 <= 24) {
                return Math.floor(diffInTime / 1000 / 60 / 60) + " hours ago";
            } else {
                return input.toDateString();
            }
        };
    }
);
